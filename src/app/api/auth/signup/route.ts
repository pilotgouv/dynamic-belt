
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = 'nodejs';

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
                    // plan: 'free' -> Default in schema
                }
            });

            // Create default Organization
            const orgName = name ? `${name}'s Organization` : `Org-${user.id.slice(0, 4)}`;
            const org = await tx.organization.create({
                data: {
                    name: orgName,
                    // plan: 'free' -> Default in schema
                    memberships: {
                        create: {
                            userId: user.id,
                            role: 'owner'
                        }
                    },
                    settings: {
                        create: {
                            currency: 'EUR',
                            shippingCostValue: 0,
                            estimateCogsFallback: 40
                        }
                    }
                }
            });

            return user;
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[SIGNUP_ERROR]", error);
        // TEMPORARY DEBUG: Return the real error message to the UI
        return NextResponse.json({
            error: "Erreur Serveur: " + (error.message || error.toString())
        }, { status: 500 });
    }
}
