
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export const runtime = 'nodejs'; // Force Node runtime for crypto/bcrypt support

export async function GET(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.email || !user.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connections = await prisma.connection.findMany({
        where: { organizationId: user.organizationId },
        select: {
            id: true,
            provider: true,
            name: true,
            status: true,
            lastSyncAt: true,
            errorMessage: true,
            // DO NOT SELECT CREDENTIALS
        }
    });

    return NextResponse.json(connections);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.email || !user.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { provider, name, credentials } = await req.json();

        if (!provider || !credentials) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const orgId = user.organizationId;
        const plan = user.plan || 'free';

        // Plan Logic: Check Active Count
        // We count ACTIVE connections. If creating a new one makes it > limit, block.
        // Limit Check Removed - Unlimited Connections for everyone now.
        // if (plan === 'free') { ... }

        const encrypted = encrypt(JSON.stringify(credentials));

        const connection = await prisma.connection.create({
            data: {
                organizationId: orgId,
                provider: provider,
                name: name || `${provider} Connection`,
                status: 'ACTIVE', // Assume active if added? Or 'DISABLED' until tested? Let's say ACTIVE for MVP flow.
                credentialsEncrypted: encrypted
            },
            select: { id: true, provider: true, status: true, name: true }
        });

        return NextResponse.json(connection);

    } catch (e: any) {
        console.error("[CONNECTION_CREATE_ERROR]", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
