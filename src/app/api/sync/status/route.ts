import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId: session.user.id } });
    if (!membership) return NextResponse.json({ error: 'No Org' }, { status: 400 });

    try {
        // Cleanup Stale Jobs > 15 mins (Catalog sync might be long)
        const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
        const staleJobs = await prisma.syncJob.updateMany({
            where: {
                orgId: membership.organizationId,
                status: 'running',
                startedAt: { lt: staleThreshold }
            },
            data: { status: 'error', error: 'Timeout (Stale)', finishedAt: new Date() }
        });

        // Find active or recent job
        const job = await prisma.syncJob.findFirst({
            where: { orgId: membership.organizationId },
            orderBy: { startedAt: 'desc' }
        });

        if (!job) {
            return NextResponse.json({ status: 'idle', progress: 0 });
        }

        // Map internal status to UI status
        // UI expects: idle, running, success/done, error/failed
        let uiStatus = 'idle';
        if (job.status === 'queued' || job.status === 'running') uiStatus = 'running';
        else if (job.status === 'success') uiStatus = 'done';
        else if (job.status === 'partial_success') uiStatus = 'done'; // Treat as done for polling stop
        else if (job.status === 'error') uiStatus = 'error';

        return NextResponse.json({
            jobId: job.id,
            status: uiStatus,
            jobStatus: job.status, // raw status: success, partial_success, error
            type: job.type,
            progress: job.progress,
            stage: job.stage,
            message: job.message,
            error: job.error
        });

    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
