
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Retrieve Settings (Create default if missing)
export async function GET(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || (!user.organizationId && !user.orgId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = user.organizationId || user.orgId;

    try {
        let settings = await prisma.settings.findUnique({
            where: { organizationId: orgId }
        });

        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    organizationId: orgId,
                    currency: "EUR",
                    vatEnabled: false,
                    dataMode: "STRICT"
                }
            });
        }

        return NextResponse.json(settings);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT: Update Settings
export async function PUT(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || (!user.organizationId && !user.orgId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = user.organizationId || user.orgId;

    try {
        const body = await req.json();

        // Security: Remove ID/OrgID injection attempts
        delete body.id;
        delete body.organizationId;

        // Basic Type Validation/Sanitization could happen here (Zod recommended usually)

        const settings = await prisma.settings.upsert({
            where: { organizationId: orgId },
            update: {
                ...body,
                updatedAt: undefined // Prisma handles this if model has @updatedAt, but Settings doesn't have it in schema provided. Schema check: Settings model didn't have updatedAt. No issue.
            },
            create: {
                organizationId: orgId,
                ...body
            }
        });

        return NextResponse.json(settings);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
