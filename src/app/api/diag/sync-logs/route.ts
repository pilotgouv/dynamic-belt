import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
    try {
        const session = await auth();
        const { searchParams } = new URL(request.url);

        let orgId = searchParams.get('orgId');

        // Auto-detect from session
        if (!orgId && session?.user) {
            orgId = (session.user as any).organizationId;
        }

        if (!orgId) return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });

        const logs = await prisma.syncLog.findMany({
            where: { organizationId: orgId },
            orderBy: { startedAt: 'desc' },
            take: 20,
            include: {
                connection: {
                    select: { name: true, provider: true }
                }
            }
        });

        return NextResponse.json({ logs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
