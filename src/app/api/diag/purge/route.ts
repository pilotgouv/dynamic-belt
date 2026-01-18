import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;

    try {
        // 1. Delete all Normalized Metrics for this Org
        const deletedFinance = await prisma.financeDaily.deleteMany({
            where: { organizationId: orgId }
        });

        const deletedProducts = await prisma.productDaily.deleteMany({
            where: { organizationId: orgId }
        });

        const deletedAds = await prisma.adsDaily.deleteMany({
            where: { organizationId: orgId }
        });

        const deletedTraffic = await prisma.trafficDaily.deleteMany({
            where: { organizationId: orgId }
        });

        // 2. Reset Connection "LastSync" status to force fresh sync
        await prisma.connection.updateMany({
            where: { organizationId: orgId },
            data: {
                lastSyncAt: null,
                lastSyncStatus: null,
                errorMessage: null,
                lastCursor: null,
                lastFullSyncAt: null,
                lastQuickSyncAt: null
            }
        });

        return NextResponse.json({
            success: true,
            deleted: {
                finance: deletedFinance.count,
                products: deletedProducts.count,
                ads: deletedAds.count,
                traffic: deletedTraffic.count
            },
            message: "Organization data purged. Connections reset for deep sync."
        });

    } catch (e: any) {
        console.error("Purge Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
