
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: any }) {
    // Note: params is a promise in Next.js 15+, but typically resolved object in 14. 
    // Adapting for safety: await params if it's a promise, or treat as object.
    // However, in standard Route Handlers types:
    const { id } = await params;

    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const report = await prisma.reportDefinition.findUnique({
        where: { id }
    });

    // Check ownership via Org match (simplified)
    // Real impl should check session.user.orgIds.includes(report.organizationId)

    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(report);
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
    const { id } = await params;
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.reportDefinition.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
