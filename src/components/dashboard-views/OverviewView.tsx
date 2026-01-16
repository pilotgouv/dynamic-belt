
'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { PilotScoreCard } from '@/components/PilotScoreCard';
import AICoachWidget from '@/components/AICoachWidget';

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
                            dimensions: ["date"], // Simplified: just daily breakdown for chart
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

    if (!loading && chartData.length === 0) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <EmptyState
                    title="En attente de signaux commerciaux"
                    message="La Vue d'ensemble consolide profit, coûts et risques en une seule vue exécutive. Une fois vos données synchronisées, PILOT révélera ce qui pilote réellement votre performance."
                    actionLabel="Synchroniser les données"
                    actionUrl="/dashboard/connections"
                    secondaryText="L'historique complet est pris en charge."
                />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

            {/* ROW A: PILOT Score & AI Coach */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <PilotScoreCard />
                </div>
                <div className="lg:col-span-1">
                    <AICoachWidget orgId={orgId} />
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

            {/* ROW C: Charts (Financial Trend) */}
            <div className="grid grid-cols-12 gap-6 h-[400px]">
                <div className="col-span-12 bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
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
            </div>

        </div>
    );
}
