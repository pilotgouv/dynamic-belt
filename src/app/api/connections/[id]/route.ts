
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest, { params }: { params: any }) {
    // Types compatibility for Next 15
    const { id } = await params;

    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Manual Cascade Delete (Since Schema Push failed)
        await prisma.syncRun.deleteMany({
            where: { connectionId: id }
        });

        await prisma.connection.delete({
            where: {
                id,
                organizationId: user.organizationId
            }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
