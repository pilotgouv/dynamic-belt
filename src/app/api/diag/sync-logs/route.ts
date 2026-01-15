import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const orgId = (session.user as any).organizationId;

        // Fetch last 10 sync runs for connections in this org
        const connections = await prisma.connection.findMany({
            where: { organizationId: orgId },
            select: { id: true, provider: true }
        });

        const connectionIds = connections.map(c => c.id);

        const logs = await prisma.syncRun.findMany({
            where: { connectionId: { in: connectionIds } },
            orderBy: { finishedAt: 'desc' },
            take: 10,
            include: { connection: { select: { provider: true } } } // Include provider name
        });

        return NextResponse.json({ logs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
