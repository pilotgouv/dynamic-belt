import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
    if (!membership) return NextResponse.json({ error: "No Organization" }, { status: 400 });

    try {
        const jobs = await prisma.syncJob.findMany({
            where: { orgId: membership.organizationId, status: 'running' }
        });

        if (jobs.length === 0) return NextResponse.json({ message: "No running jobs" });

        await prisma.syncJob.updateMany({
            where: { orgId: membership.organizationId, status: 'running' },
            data: { status: 'stopping', message: 'Arrêt demandé...' }
        });

        return NextResponse.json({ success: true, count: jobs.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
