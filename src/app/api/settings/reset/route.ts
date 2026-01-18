import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
    if (!membership) return NextResponse.json({ error: 'No Org' }, { status: 400 });
    const orgId = membership.organizationId;

    try {
        // Delete Data in order to avoid FK constraints if any (usually OrderItem -> Order)
        await prisma.orderItem.deleteMany({ where: { orgId } });
        await prisma.order.deleteMany({ where: { orgId } });
        await prisma.product.deleteMany({ where: { orgId } });

        await prisma.financeDaily.deleteMany({ where: { organizationId: orgId } });
        await prisma.adsDaily.deleteMany({ where: { organizationId: orgId } });
        await prisma.trafficDaily.deleteMany({ where: { organizationId: orgId } });

        // Logs
        await prisma.syncLog.deleteMany({ where: { organizationId: orgId } });
        await prisma.syncJob.deleteMany({ where: { orgId } });

        // Reset Connections
        await prisma.connection.updateMany({
            where: { organizationId: orgId },
            data: {
                lastCursor: null,
                lastFullSyncAt: null,
                lastQuickSyncAt: null,
                lastSyncAt: null,
                status: 'NEEDS_SYNC',
                errorMessage: null
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Reset Error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
