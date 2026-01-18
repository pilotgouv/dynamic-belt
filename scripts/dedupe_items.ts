
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orgId = "d317888f-af6b-40d1-a25d-37342548537a";
    console.log("Analyzing Organization:", orgId);

    // Fetch all items
    const items = await prisma.orderItem.findMany({
        where: { orgId },
        select: { id: true, orderId: true, externalLineId: true }
    });

    console.log(`Found ${items.length} total items.`);

    const seen = new Map<string, string>(); // Key -> ID to keep
    const toDelete: string[] = [];

    for (const item of items) {
        // Compound Key
        // Fallback for null lineId (shouldn't happen on Woo)
        const key = `${item.orderId}-${item.externalLineId || 'null'}`;
        if (seen.has(key)) {
            toDelete.push(item.id);
        } else {
            seen.set(key, item.id);
        }
    }

    console.log(`Found ${toDelete.length} duplicates to delete.`);

    if (toDelete.length > 0) {
        await prisma.orderItem.deleteMany({
            where: { id: { in: toDelete } }
        });
        console.log(`Deleted ${toDelete.length} duplicates.`);
    }

    // Force aggregator rebuild
    console.log("Clearing Aggregates to force refresh...");
    await prisma.financeDaily.deleteMany({ where: { organizationId: orgId } });
    await prisma.productDaily.deleteMany({ where: { organizationId: orgId } });
    console.log("Aggregates Cleared.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
