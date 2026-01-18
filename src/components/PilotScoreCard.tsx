"use client";

import { useEffect, useState } from 'react';
import { ArrowRight, TrendingUp, Target, ShieldAlert, Database, Zap, X, Link as LinkIcon } from "lucide-react";
import Link from 'next/link';

interface PilotScore {
    scoreTotal: number;
    breakdown: {
        profitability: number;
        trend: number;
        acquisition: number;
        risk: number;
        data: number;
    };
    reasons: string[];
    actions: string[];
}

export function PilotScoreCard() {
    const [data, setData] = useState<PilotScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPillar, setSelectedPillar] = useState<{ label: string, value: number, max: number } | null>(null);

    useEffect(() => {
        fetch('/api/pilot/score')
            .then(res => res.json())
            .then(res => {
                if (res.error) console.error(res.error);
                else setData(res);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    if (loading) return <div className="w-full h-[420px] bg-slate-50/50 animate-pulse rounded-3xl border border-slate-200/60"></div>;
    if (!data) return <div className="w-full h-[420px] border border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 font-montserrat font-medium">Verdict indisponible</div>;

    const { scoreTotal, breakdown, actions } = data;

    // --- COLOR LOGIC ---
    let scoreGradient = "from-emerald-400 to-emerald-600";
    let textColor = "text-emerald-900";
    let statusText = "Excellent";
    let ringColor = "#10b981";
    let glowColor = "bg-emerald-400"; // Glow Color

    if (scoreTotal < 80) {
        scoreGradient = "from-amber-400 to-amber-600";
        textColor = "text-slate-800";
        statusText = "Attention";
        ringColor = "#f59e0b";
        glowColor = "bg-amber-400";
    }
    if (scoreTotal < 50) {
        scoreGradient = "from-rose-400 to-rose-600";
        textColor = "text-rose-900";
        statusText = "Fragile";
        ringColor = "#ef4444";
        glowColor = "bg-rose-400";
    }

    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (scoreTotal / 100) * circumference;

    const handlePillarClick = (label: string, value: number, max: number) => {
        setSelectedPillar({ label, value, max });
    };

    return (
        <div className="relative w-full h-full font-montserrat">
            {/* GLOWING PULSE BEHIND */}
            <div className={`absolute inset-0 rounded-[26px] ${glowColor} blur-lg animate-heartbeat transition-all duration-1000`} />

            {/* MAIN CARD */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-6 flex flex-col h-full justify-between gap-6 relative overflow-hidden group hover:shadow-md transition-all duration-500 z-10">



                {/* Header */}
                <div className="flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 drop-shadow-sm font-montserrat">Financial Engine V2</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${scoreGradient} shadow-sm`}>
                        LIVE
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 flex-1 z-10">
                    {/* LEFT: SCORE */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <div className="absolute inset-0 bg-slate-100/50 rounded-full blur-xl scale-90" />
                            <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                                <circle cx="80" cy="80" r={radius} stroke="#F1F5F9" strokeWidth="5" fill="none" />
                                <circle
                                    cx="80" cy="80" r={radius}
                                    stroke={ringColor}
                                    strokeWidth="5"
                                    fill="none"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    className="transition-all duration-[1.5s] ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-5xl font-bold tracking-tighter text-slate-900`}>
                                    {scoreTotal}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Global</span>
                            </div>
                        </div>
                        <div className={`mt-2 font-bold text-lg ${textColor} tracking-tight`}>{statusText}</div>
                    </div>

                    {/* RIGHT: PILLARS LIST */}
                    <div className="flex-1 w-full space-y-3">
                        <PillarRow
                            label="Rentabilité" value={breakdown.profitability} max={30}
                            icon={<ArrowRight size={14} className="-rotate-45" />}
                            color="bg-blue-500" onClick={handlePillarClick}
                        />
                        <PillarRow
                            label="Croissance" value={breakdown.trend} max={20}
                            icon={<TrendingUp size={14} />}
                            color="bg-indigo-500" onClick={handlePillarClick}
                        />
                        <PillarRow
                            label="Acquisition" value={breakdown.acquisition} max={20}
                            icon={<Target size={14} />}
                            color="bg-violet-500" onClick={handlePillarClick}
                        />
                        <PillarRow
                            label="Solidité" value={breakdown.risk} max={20}
                            icon={<ShieldAlert size={14} />}
                            color="bg-orange-500" onClick={handlePillarClick}
                        />
                        <PillarRow
                            label="Data & IA" value={breakdown.data} max={10}
                            icon={<Database size={14} />}
                            color="bg-cyan-500" onClick={handlePillarClick}
                        />
                    </div>
                </div>

                {/* BOTTOM: FOCUS */}
                <div className="mt-2 pt-4 border-t border-slate-100/80">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-yellow-100 rounded-lg text-yellow-700 shrink-0">
                            <Zap size={14} fill="currentColor" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Focus Prioritaire</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">
                                {actions[0] || "Continuez d'optimiser, le cap est bon."}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* --- SIDE SHEET --- */}
            <AnalysisSheet
                pillar={selectedPillar}
                onClose={() => setSelectedPillar(null)}
            />
        </div>
    );
}

function PillarRow({ label, value, max, icon, color, onClick }: any) {
    const percentage = (value / max) * 100;
    return (
        <div
            onClick={() => onClick(label, value, max)}
            className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
        >
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-xs font-bold text-slate-700 truncate">{label}</span>
                    <span className="text-xs font-bold text-slate-900">{value} <span className="text-slate-300 font-normal">/{max}</span></span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color} opacity-80 group-hover:opacity-100 transition-all duration-500`} style={{ width: `${percentage}%` }} />
                </div>
            </div>
        </div>
    )
}

function AnalysisSheet({ pillar, onClose }: { pillar: any, onClose: any }) {
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => { setIsVisible(!!pillar); }, [pillar]);

    const percentage = pillar ? (pillar.value / pillar.max) * 100 : 0;
    const isMissing = pillar?.value === 0;

    // DYNAMIC ADVICE LOGIC
    const getAdvice = (p: any) => {
        if (!p) return "";
        const score = (p.value / p.max) * 100;

        switch (p.label) {
            case 'Rentabilité':
                if (score < 40) return "Votre marge nette est trop faible. Vérifiez vos COGS ou coupez les publicités à ROAS < 2.0. Augmentez votre panier moyen (AOV).";
                if (score < 70) return "Rentabilité correcte mais optimisable. Tentez de réduire les frais logistiques ou de renégocier avec vos fournisseurs.";
                return "Excellente rentabilité. Vous avez la marge de manœuvre pour accélérer l'acquisition (scale).";
            case 'Croissance':
                if (score < 50) return "Croissance en berne. Lancez " + '"New Arrivals"' + " ou une offre temporaire pour réveiller la base client.";
                return "Belle dynamique de croissance. Assurez-vous que la logistique suit le rythme des commandes.";
            case 'Acquisition':
                if (score < 50) return "Dépendance à l'organique ou ROAS faible. Testez de nouvelles créas publicitaires (UGC) pour baisser le CPA.";
                return "Machine d'acquisition efficace. Pensez à explorer de nouveaux canaux (TikTok, YouTube) pour diversifier.";
            case 'Solidité':
                if (score < 60) return "Risque élevé de concentration. Si votre 'Produit Hero' ou 'Canal Principal' faiblit, tout le business est à risque. Diversifiez.";
                return "Business résilient et bien diversifié. Risque structurel faible.";
            case 'Data & IA':
                if (score < 100) return "Pour atteindre 10/10 : Connectez toutes les sources (Ventes + Pubs + Analytics + Frais). Cela permet à l'IA de croiser les données pour des prédictions fiables.";
                return "Infrastructure Data parfaite. L'IA dispose de tous les signaux pour piloter votre croissance.";
            default:
                return "Optimisez ce levier pour améliorer votre score global.";
        }
    };

    return (
        <>
            <div onClick={onClose} className={`fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[100] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
            <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-[101] transform transition-transform duration-500 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>
                {pillar && (
                    <div className="h-full flex flex-col p-6 font-montserrat">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Analyse</h3>
                                <h2 className="text-2xl font-bold text-slate-900">{pillar.label}</h2>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={18} /></button>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                <div className="text-5xl font-bold text-slate-900 mb-2">{pillar.value}</div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${percentage}%` }} /></div>
                                <div className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-widest">Points accumulés</div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-slate-900">État des lieux</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {percentage > 60 ? "Performance solide. Ce levier contribue positivement à votre score." : "Performance en retrait. Ce levier pénalise votre score global."}
                                </p>
                            </div>

                            <div className="p-5 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm">
                                <h3 className="font-bold text-indigo-900 text-sm mb-2 flex items-center gap-2"><Zap size={14} fill="currentColor" /> Conseil Captain</h3>
                                <p className="text-sm text-indigo-800 leading-relaxed italic">
                                    "{getAdvice(pillar)}"
                                </p>
                            </div>

                            {/* Specific prompt for Data if missing */}
                            {(pillar.label === 'Data & IA' && percentage < 100) && (
                                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><LinkIcon size={16} /></div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-amber-800">Sources manquantes</div>
                                        <Link href="/dashboard/connections" className="text-xs underline text-amber-600">Gérer les connexions</Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
