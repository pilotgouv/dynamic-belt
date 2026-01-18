import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
    const session = await auth();
    if (!(session?.user as any)?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    if (!fromStr || !toStr) return NextResponse.json([]);

    const from = new Date(fromStr);
    const to = new Date(toStr);

    try {
        const data = await prisma.metaInsight.groupBy({
            by: ['devicePlatform'],
            where: {
                orgId: (session!.user as any).organizationId,
                date: { gte: from, lte: to },
                breakdownType: 'DEVICE'
            },
            _sum: {
                spend: true,
                purchases: true,
                purchaseValue: true,
                impressions: true,
                clicks: true
            }
        });

        // Safe mapping
        const result = data.map(d => ({
            device: d.devicePlatform,
            spend: d._sum.spend || 0,
            revenue: d._sum.purchaseValue || 0,
            conversions: d._sum.purchases || 0,
            impressions: d._sum.impressions || 0,
            clicks: d._sum.clicks || 0,
            roas: (d._sum.spend || 0) > 0 ? (d._sum.purchaseValue || 0) / (d._sum.spend || 0) : 0
        }));

        return NextResponse.json(result);
    } catch (e: any) {
        console.error("Device Stats Error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
