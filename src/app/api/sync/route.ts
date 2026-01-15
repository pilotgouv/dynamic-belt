import { NextResponse } from 'next/server';
import { SyncService } from '@/services/syncService';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    const session = await auth();

    // 1. Guard: Check Auth
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { connectionId } = body;
        const orgId = (session.user as any).organizationId;

        if (connectionId) {
            // Single Sync
            // Verify ownership
            const output = await SyncService.syncConnection(connectionId);
            return NextResponse.json({ success: true, result: output });
        } else {
            // Sync All Active
            const { ConnectionService } = await import('@/lib/connections/connection-service');
            const activeConnections = await ConnectionService.getActiveConnections(orgId);

            const results = [];
            for (const conn of activeConnections) {
                try {
                    const res = await SyncService.syncConnection(conn.id, conn);
                    results.push({
                        provider: conn.provider,
                        success: res.success,
                        imported: res.importedCount,
                        error: null
                    });
                } catch (e: any) {
                    console.error(`Sync failed for ${conn.provider}`, e);
                    results.push({
                        provider: conn.provider,
                        success: false,
                        imported: 0,
                        error: e.message
                    });
                }
            }

            return NextResponse.json({ success: true, results });
        }

    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
