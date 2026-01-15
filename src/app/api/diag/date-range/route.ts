import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;

    try {
        // Finance Diagnostic
        const finance = await prisma.financeDaily.aggregate({
            where: { organizationId: orgId },
            _min: { date: true },
            _max: { date: true },
            _count: { id: true }
        });

        // Product Diagnostic
        const products = await prisma.productDaily.aggregate({
            where: { organizationId: orgId },
            _min: { date: true },
            _max: { date: true },
            _count: { id: true }
        });

        // Get Last Sync Log
        const connections = await prisma.connection.findMany({ where: { organizationId: orgId }, select: { id: true } });
        const lastLog = await prisma.syncLog.findFirst({
            where: { connectionId: { in: connections.map(c => c.id) } },
            orderBy: { finishedAt: 'desc' }
        });

        return NextResponse.json({
            finance: {
                min: finance._min.date,
                max: finance._max.date,
                count: finance._count.id
            },
            products: {
                min: products._min.date,
                max: products._max.date,
                count: products._count.id
            },
            last_sync_log: lastLog
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
