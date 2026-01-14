import { NextResponse } from 'next/server';
import { SyncService } from '@/services/syncService';
import { auth } from '@/auth';

export async function POST(req: Request) {
    const session = await auth();

    // 1. Guard: Check Auth
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { connectionId } = body;

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 });
        }

        // 2. Trigger Sync Logic
        // In a real app, this might offload to a queue (Redis/Bull)
        // For V2 prototype, we run it inline (careful with Vercel timeouts)
        const result = await SyncService.syncConnection(connectionId);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
