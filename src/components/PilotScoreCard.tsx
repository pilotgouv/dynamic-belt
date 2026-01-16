
"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, ShieldAlert, CheckCircle, Database } from "lucide-react";

interface PilotScore {
    scoreTotal: number;
    breakdown: {
        profitability: number; // /30
        trend: number;         // /20
        acquisition: number;   // /20
        risk: number;          // /20
        data: number;          // /10
    };
    reasons: string[];
    actions: string[];
}

export function PilotScoreCard() {
    const [data, setData] = useState<PilotScore | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch default Last 30 Days
        fetch('/api/pilot/score')
            .then(res => res.json())
            .then(res => {
                if (res.error) console.error(res.error);
                else setData(res);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>;
    if (!data) return <div className="h-64 border rounded-xl flex items-center justify-center">Score indisponible</div>;

    // Color Logic
    const getColor = (s: number) => {
        if (s >= 80) return "text-green-600";
        if (s >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    const getBgColor = (s: number) => {
        if (s >= 80) return "bg-green-100 border-green-200";
        if (s >= 50) return "bg-yellow-50 border-yellow-200";
        return "bg-red-50 border-red-200";
    };

    return (
        <div className={`border-2 shadow-sm rounded-xl overflow-hidden ${getBgColor(data.scoreTotal)}`}>
            <div className="p-4 border-b border-black/5 bg-white/30 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold uppercase tracking-wider text-gray-700">PILOT Score</h3>
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border">V2.5 EXACT</span>
                </div>
            </div>
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* LEFT: BIG SCORE */}
                    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white/50 rounded-xl min-w-[200px]">
                        <div className={`text-6xl font-black ${getColor(data.scoreTotal)}`}>
                            {data.scoreTotal}<span className="text-2xl text-gray-400">/100</span>
                        </div>
                        <div className="mt-2 text-sm font-medium uppercase tracking-wide text-gray-500">
                            {data.scoreTotal >= 80 ? 'Excellente Santé' : data.scoreTotal >= 50 ? 'Attention Requise' : 'Situation Critique'}
                        </div>
                    </div>

                    {/* MIDDLE: BREAKDOWN */}
                    <div className="flex-1 space-y-3 min-w-[240px]">
                        <ScoreRow label="Rentabilité" score={data.breakdown.profitability} max={30} icon={<TrendingUp size={14} />} />
                        <ScoreRow label="Croissance (Trend)" score={data.breakdown.trend} max={20} icon={<TrendingUp size={14} />} />
                        <ScoreRow label="Acquisition" score={data.breakdown.acquisition} max={20} icon={<TrendingUp size={14} />} />
                        <ScoreRow label="Risque" score={data.breakdown.risk} max={20} icon={<ShieldAlert size={14} />} />
                        <ScoreRow label="Data" score={data.breakdown.data} max={10} icon={<Database size={14} />} />
                    </div>

                    {/* RIGHT: ACTIONS */}
                    <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
                            <AlertTriangle size={16} className="text-orange-500" />
                            Actions Prioritaires
                        </h4>
                        <ul className="space-y-2">
                            {data.actions.length > 0 ? data.actions.map((act, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                    {act}
                                </li>
                            )) : (
                                <li className="text-sm text-gray-400 italic">Aucune action urgente. Keep pushing!</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ScoreRow({ label, score, max, icon }: { label: string, score: number, max: number, icon: any }) {
    const pct = (score / max) * 100;
    return (
        <div className="flex items-center gap-3 text-sm">
            <div className="w-6 text-gray-400">{icon}</div>
            <div className="w-32 font-medium text-gray-700">{label}</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="w-12 text-right text-xs font-mono text-gray-500">
                {score}/{max}
            </div>
        </div>
    );
}
