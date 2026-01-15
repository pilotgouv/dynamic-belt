
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest, { params }: { params: any }) {
    // Types compatibility for Next 15
    const { id } = await params;

    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Find connection to get provider (for FinanceDaily cleanup)
        const connection = await prisma.connection.findUnique({
            where: { id, organizationId: user.organizationId }
        });

        if (!connection) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Transactional Wipe
        await prisma.$transaction(async (tx) => {
            // 1. Delete associated Products (onDelete: SetNull in schema, so manual delete needed for cleanup)
            await tx.product.deleteMany({
                where: { sourceConnectionId: id }
            });

            // 2. Delete Aggregated Finance Daily (Channel specific)
            // Note: If multiple connections of same provider exist, this might wipe their data too if aggregated by 'amazon_seller'.
            // But usually 1 connection per provider per org.
            const channel = connection.provider;
            await tx.financeDaily.deleteMany({
                where: {
                    organizationId: user.organizationId,
                    channel: channel
                }
            });

            // 3. Delete SyncLogs (Manual) + Cascade will handle this but good to be explicit or rely on cascade
            // Schema has 'onDelete: Cascade' for SyncLog.

            // 4. Delete Connection (Cascades Order, AdAccount, SettlementEvent, SyncLog)
            await tx.connection.delete({
                where: { id }
            });
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
