
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orgId = "d317888f-af6b-40d1-a25d-37342548537a";

    const items = await prisma.orderItem.groupBy({
        by: ['sku'],
        where: { orgId },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
    });

    console.log("Top 5 SKUs by Quantity:");
    for (const i of items) {
        console.log(`SKU: ${i.sku}, Qty: ${i._sum.quantity}`);
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
