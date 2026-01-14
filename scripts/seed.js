
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'marc@dynamicbelt.com';
    const password = 'admin'; // Same as mock
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash: hashedPassword }, // Ensure password matches
        create: {
            email,
            name: 'Marc Vicario',
            passwordHash: hashedPassword,
        },
    });

    console.log(`Created/Updated User: ${user.id}`);

    // Create Organization
    const org = await prisma.organization.create({
        data: {
            name: "Dynamic Belt Inc.",
            plan: "premium",
            memberships: {
                create: {
                    userId: user.id,
                    role: 'owner'
                }
            },
            settings: {
                create: {
                    currency: 'EUR',
                    shippingCostAvg: 4.50,
                    cogsEstimatedPercent: 40
                }
            }
        }
    });

    console.log(`Created Organization: ${org.id}`);

    // Seed initial Finance Data so the dashboard isn't empty
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.financeDaily.create({
        data: {
            organizationId: org.id,
            date: yesterday,
            revenueGross: 1250.00,
            revenueNet: 1100.00,
            ordersCount: 15,
            adSpendTotal: 300.00,
            profitEstimated: 500.00,
            marginPercent: 40.0
        }
    });
    console.log('Seeded Finance Data');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
