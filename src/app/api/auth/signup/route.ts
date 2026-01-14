
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password || password.length < 8) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Transaction to ensure complete setup
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    name,
                    passwordHash,
                    plan: 'free'
                }
            });

            // Create default Organization
            const orgName = name ? `${name}'s Organization` : `Org-${user.id.slice(0, 4)}`;
            const org = await tx.organization.create({
                data: {
                    name: orgName,
                    plan: 'free',
                    memberships: {
                        create: {
                            userId: user.id,
                            role: 'owner'
                        }
                    },
                    settings: {
                        create: {
                            currency: 'EUR',
                            shippingCostAvg: 0,
                            cogsEstimatedPercent: 40
                        }
                    }
                }
            });

            return user;
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Signup error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
