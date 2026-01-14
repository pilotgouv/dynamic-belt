"use client";

import { useApp } from '@/hooks/useApp';

export const useSyncEngine = () => {
    const { connections, toggleConnection } = useApp();

    const syncAll = async () => {
        // 1. Identify active connections
        const active = connections.filter(c => c.status === 'connected');

        // 2. Mock API Calls for each
        for (const conn of active) {
            console.log(`[SyncEngine] Pulling data for ${conn.id}...`);
            // In V2, here we would call /api/sync/${conn.id}
            await new Promise(r => setTimeout(r, 800)); // Simulate latency
        }

        alert(`Synchronisation terminée pour ${active.length} sources.`);
    };

    return { syncAll };
};
