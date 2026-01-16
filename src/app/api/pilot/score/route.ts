
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PilotService } from "@/services/pilotService";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;

    if (!user || !user.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    // Default: Last 30 days
    const end = endParam ? new Date(endParam) : new Date();
    const start = startParam ? new Date(startParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
        // Option: Check if a score exists for this day/range to avoid spamming calculations?
        // For now, always calculate live to ensure responsiveness to new data imports.

        const score = await PilotService.generateScore(user.organizationId, { start, end });
        return NextResponse.json(score);
    } catch (error: any) {
        console.error("Pilot Score Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
