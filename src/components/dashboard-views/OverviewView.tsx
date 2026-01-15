'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface OverviewViewProps {
    orgId: string;
}

export default function OverviewView({ orgId }: OverviewViewProps) {
    const { range } = useDateRange();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        async function fetchData() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/reports/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        organizationId: orgId,
                        config: {
                            metrics: ["revenue", "profit", "spend", "margin_percent"],
                            dimensions: ["date"],
                        },
                        range: range
                    }),
                    signal: controller.signal
                });

                if (!response.ok) throw new Error("Failed to fetch data");
                const result = await response.json();

                if (isMounted) {
                    setData(result);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError' && isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        if (orgId && range) {
            fetchData();
        }

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [orgId, range]);

    // Formatters
    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(val);
    const formatPercent = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1 }).format(val / 100);

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center">
                <AlertTriangle size={48} className="text-red-400 mb-4" />
                <h2 className="text-lg font-bold text-gray-900">Erreur de chargement</h2>
                <p className="text-gray-500">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-black text-white rounded-lg text-sm">Réessayer</button>
            </div>
        );
    }

    // Prepare Data
    const summary = data?.summary || {};
    const chartData = data?.series || [];

    // Calculate Trend/Delta (Mocked)
    // To do real delta, we'd need to fetch Previous Range too.

    if (!loading && chartData.length === 0) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <EmptyState
                    title="En attente de signaux commerciaux"
                    message="La Vue d'ensemble consolide profit, coûts et risques en une seule vue exécutive. Une fois vos données synchronisées, PILOT révélera ce qui pilote réellement votre performance."
                    actionLabel="Synchroniser les données"
                    actionUrl="/dashboard/connections"
                    secondaryText="L'historique complet est pris en charge (Tout, Année, Personnalisé)."
                />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

            {/* ROW A: PILOT Score & Drivers */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between relative overflow-hidden">
                    <div className="z-10 w-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">PILOT Score</h3>
                                <p className="text-xs text-gray-400 mt-1">Santé globale de l'entreprise</p>
                            </div>
                            <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${(summary.pilot_status === 'Excellent' || summary.pilot_status === 'Good') ? 'bg-green-100 text-green-700' :
                                    summary.pilot_status === 'Fair' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {summary.pilot_status || 'Calcul...'}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Radial Ring */}
                            <div className="relative w-24 h-24 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                    <circle
                                        cx="48" cy="48" r="40"
                                        stroke={
                                            (summary.pilot_score >= 80) ? '#10b981' :
                                                (summary.pilot_score >= 50) ? '#f59e0b' : '#ef4444'
                                        }
                                        strokeWidth="8" fill="none"
                                        strokeDasharray="251.2"
                                        strokeDashoffset={251.2 - (251.2 * (summary.pilot_score || 0)) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-gray-900">{summary.pilot_score || 0}</span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {(summary.pilot_score >= 80) ? "Votre entreprise performe au dessus des cibles. Maintenez le cap." :
                                        (summary.pilot_score >= 50) ? "Performance correcte, mais des optimisations de marge ou d'acquisition sont possibles." :
                                            "Attention requise. Revoyez votre structure de coûts ou vos campagnes."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 md:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Driver: Profitability */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Rentabilité</div>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-2xl font-bold text-gray-900">{summary.pilot_components?.profit || 0}/100</span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${summary.pilot_components?.profit || 0}%` }}></div>
                        </div>
                    </div>

                    {/* Driver: Margin */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Sante Marge</div>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-2xl font-bold text-gray-900">{summary.pilot_components?.margin || 0}/100</span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${(summary.pilot_components?.margin >= 80) ? 'bg-green-500' : 'bg-yellow-500'
                                }`} style={{ width: `${summary.pilot_components?.margin || 0}%` }}></div>
                        </div>
                    </div>

                    {/* Driver: Acquisition */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Efficacité Pubs</div>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-2xl font-bold text-gray-900">{summary.pilot_components?.roas || 0}/100</span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${(summary.pilot_components?.roas >= 80) ? 'bg-purple-500' :
                                    (summary.pilot_components?.roas >= 50) ? 'bg-purple-400' : 'bg-red-400'
                                }`} style={{ width: `${summary.pilot_components?.roas || 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW B: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPICard
                    title="Vrai Profit"
                    value={summary.profit ? formatCurrency(summary.profit) : '-'}
                    loading={loading}
                    description="Profit net après tous coûts"
                />
                <KPICard
                    title="Chiffre d'Affaires Net"
                    value={summary.revenue ? formatCurrency(summary.revenue) : '-'}
                    loading={loading}
                />
                <KPICard
                    title="Dépenses Pubs"
                    value={summary.spend ? formatCurrency(summary.spend) : '-'}
                    loading={loading}
                />
                <KPICard
                    title="Marge Globale"
                    value={summary.margin_percent ? summary.margin_percent.toFixed(1) : '-'}
                    suffix="%"
                    loading={loading}
                />
            </div>

            {/* ROW C: Charts & Assistant */}
            <div className="grid grid-cols-12 gap-6 h-[450px]">
                <div className="col-span-12 md:col-span-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-gray-900">Tendance Financière</h3>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Profit</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-300"></div> CA Net</div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        {loading ? (
                            <div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" /></div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(str) => {
                                            const d = new Date(str);
                                            return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                                        }}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `${val / 1000}k€`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                        labelStyle={{ color: '#6B7280', fontSize: '12px', marginBottom: '8px' }}
                                        formatter={(val: any) => formatCurrency(Number(val) || 0)}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#E5E7EB"
                                        strokeWidth={2}
                                        fill="transparent"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="profit"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        fill="url(#colorProfit)"
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <p>Aucune donnée pour cette période</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
                    {/* AI Coach */}
                    <div className="flex-1 bg-gradient-to-br from-indigo-50/50 to-white rounded-2xl p-6 border border-indigo-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative">
                        <div className="absolute top-4 right-4">
                            <BotIcon />
                        </div>
                        <h3 className="text-sm font-bold text-indigo-900 mb-3">Coach IA</h3>
                        <p className="text-sm text-indigo-800 leading-relaxed font-medium">
                            {summary.profit > 0
                                ? "La rentabilité est positive. C'est le moment d'accélérer sur vos produits Hero pour maximiser la marge nette."
                                : "Attention, la rentabilité est sous pression. Analysez vos coûts publicitaires et vérifiez vos marges produits."}
                        </p>
                        <button className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide">
                            Voir détails →
                        </button>
                    </div>

                    {/* Alerts (Placeholder) */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-1/2">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-gray-400" /> Alertes
                        </h3>
                        <div className="text-xs text-gray-500 italic">Aucune alerte critique.</div>
                    </div>
                </div>
            </div>

        </div>
    );
}

function BotIcon() {
    return (
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" /><path d="m8 6 4-4 4 4" /><path d="M12 18v6" /><path d="M19.07 4.93 22 2" /><path d="m2 2 2.93 2.93" /><path d="M12 12v6" /><circle cx="12" cy="12" r="9" /></svg>
        </div>
    )
}
