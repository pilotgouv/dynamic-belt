
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, config, organizationId } = await req.json();

        // 1. Paywall Check (Max 1 report for FREE plan)
        // We check User plan or Organization plan. Schema says User has plan now.
        // Let's assume User plan enforcement for simplicity/compliance with prompt.
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });

        if (user?.plan === 'free') {
            const count = await prisma.reportDefinition.count({
                where: { organizationId }
            });
            if (count >= 1) {
                return NextResponse.json({
                    error: "Plan Gratuit limité à 1 rapport sauvegardé. Passez Premium."
                }, { status: 403 });
            }
        }

        const report = await prisma.reportDefinition.create({
            data: {
                name,
                config,
                organizationId,
                isPreset: false
            }
        });

        return NextResponse.json(report);

    } catch (error: any) {
        console.error("Save Report Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) return NextResponse.json({ error: "Org ID required" }, { status: 400 });

    const reports = await prisma.reportDefinition.findMany({
        where: { organizationId },
        orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(reports);
}
