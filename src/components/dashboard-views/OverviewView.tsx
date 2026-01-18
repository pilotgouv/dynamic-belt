'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
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

        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
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
                    })
                });

                if (!response.ok) throw new Error("Failed to fetch data");
                const result = await response.json();

                if (isMounted) setData(result);
            } catch (err: any) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        if (orgId && range) fetchData();
        return () => { isMounted = false; };
    }, [orgId, range]);

    // Safe formatter
    const formatCurrency = (val: any) => {
        if (typeof val !== 'number' || isNaN(val)) return '-';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(val);
    };

    const formatPercent = (val: any) => {
        if (typeof val !== 'number' || isNaN(val)) return '-';
        return val.toFixed(1);
    };

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

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 h-96">
                <Loader2 size={32} className="animate-spin text-gray-300" />
            </div>
        )
    }

    // Default to empty object if null
    const summary = data?.summary || {};
    const chartData = data?.series || [];

    // Valid data check
    // If we have no chart data, we consider it "Empty State" usually, but check if we have summary values > 0
    const hasData = chartData.length > 0 || (summary.total_revenue > 0);

    if (!hasData && !loading) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <EmptyState
                    title="En attente de signaux commerciaux"
                    message="La Vue d'ensemble consolide profit, coûts et risques en une seule vue exécutive. Connectez vos sources pour activer PILOT."
                    actionLabel="Synchroniser les données"
                    actionUrl="/dashboard/connections"
                    secondaryText="Synchronisation historique incluse."
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
                    value={formatCurrency(summary.total_profit)}
                    loading={loading}
                    description="Profit net après tous coûts"
                />
                <KPICard
                    title="Chiffre d'Affaires Net"
                    value={formatCurrency(summary.total_revenue_net)}
                    loading={loading}
                />
                <KPICard
                    title="Dépenses Pubs"
                    value={formatCurrency(summary.total_spend)}
                    loading={loading}
                />
                <KPICard
                    title="Marge Globale"
                    value={formatPercent(summary.global_margin)}
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
                                    dataKey="revenue_net"
                                    stroke="#E5E7EB"
                                    strokeWidth={2}
                                    fill="transparent"
                                    name="CA Net"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="profit_estimated"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fill="url(#colorProfit)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                    name="Profit"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
}
