
'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Sparkles, AlertCircle } from 'lucide-react';

export default function AICoachWidget({ orgId }: { orgId: string }) {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchInsight() {
            setLoading(true);
            try {
                const res = await fetch('/api/pilot/coach', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: new Date().toISOString() })
                });
                const json = await res.json();
                if (isMounted) setInsight(json.insight);
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        if (orgId) fetchInsight();
        return () => { isMounted = false; };
    }, [orgId]);

    return (
        <div className="h-full min-h-[180px] bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex flex-col relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Bot size={120} />
            </div>

            <div className="flex items-center gap-2 mb-4 z-10">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Sparkles size={20} className="text-yellow-300" />
                </div>
                <h3 className="font-bold text-lg tracking-wide">Coach "Captain"</h3>
            </div>

            <div className="flex-1 z-10 flex items-center">
                {loading ? (
                    <div className="flex items-center gap-2 text-indigo-200 animate-pulse">
                        <Bot size={18} /> Analyse en cours...
                    </div>
                ) : insight ? (
                    <p className="text-indigo-50 text-sm leading-relaxed font-medium">
                        " {insight} "
                    </p>
                ) : (
                    <div className="flex items-center gap-2 text-indigo-300">
                        <AlertCircle size={18} /> Pas d'analyse disponible.
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-indigo-300 z-10">
                <span>Analyse vs Période précédente (-7j)</span>
                {/* Could add a Configure button here */}
            </div>
        </div>
    );
}
