import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SyncService } from '@/services/syncService';
import { NextResponse } from 'next/server';
import * as NextServer from 'next/server';

export const maxDuration = 300; // Vercel Hobby Limit (5min)

// Dynamic 'after' resolution (stable in 16, unstable in 15)
const afterApi = (NextServer as any).after || (NextServer as any).unstable_after || ((cb: any) => cb());

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (e) { }

    // Determine Type
    const baseType = (body as any).fullSync ? 'full' : 'quick';
    const connectionId = (body as any).connectionId;
    const type = connectionId ? `${baseType}:${connectionId}` : baseType;

    // Get Org
    const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
    if (!membership) return NextResponse.json({ error: 'No Organization found' }, { status: 400 });

    // Create Job
    const job = await prisma.syncJob.create({
        data: {
            orgId: membership.organizationId,
            type: type,
            status: 'queued',
            message: 'Démarrage...',
            progress: 0
        }
    });

    // Start Worker (Detached execution pattern for Vercel)
    // We do NOT await this. Next.js might warn/kill, but Vercel usually allows short background tasks.
    // If it dies, the Job stays 'running' or 'queued'. 
    // User can retry.
    // "waitUntil" is available in Next.js 15 / Vercel Edge functions. Here we assume Node.
    // We use setImmediate to detach from event loop for response.

    const worker = async () => {
        console.log(`[Job ${job.id}] Background start`);
        try {
            await SyncService.processJob(job.id);
        } catch (e) {
            console.error(`[Job ${job.id}] Failed`, e);
        }
    };

    // Execute after response to prevent Vercel freeze
    try {
        afterApi(worker);
    } catch (e) {
        worker();
    }

    return NextResponse.json({ success: true, jobId: job.id, status: 'queued' });
}
