'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Megaphone, Loader2, Brain, Smartphone, Monitor, Tablet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface AdsViewProps {
    orgId: string;
}

export default function AdsView({ orgId }: AdsViewProps) {
    const { range } = useDateRange();
    const [data, setData] = useState<any>(null);
    const [deviceData, setDeviceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (val: number | undefined) => {
        if (val === undefined || val === null) return '-';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(val);
    };

    const formatNumber = (val: number | undefined) => {
        if (val === undefined || val === null) return '-';
        return new Intl.NumberFormat('fr-FR').format(val);
    };

    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            setLoading(true);
            setLoading(true);

            // 1. Fetch Main Report
            try {
                const reportRes = await fetch('/api/reports/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        organizationId: orgId,
                        config: {
                            metrics: ["spend", "impressions", "clicks", "roas", "cpa", "contribution"],
                            dimensions: ["channel", "campaign"],
                            dateRange: { start: range.start, end: range.end }
                        }
                    })
                });
                const reportJson = await reportRes.json();
                if (isMounted) setData(reportJson);
            } catch (error) {
                console.error("Failed to fetch ads report", error);
            }

            // 2. Fetch Device Breakdown (Independent)
            try {
                const deviceRes = await fetch(`/api/dashboard/devices?from=${range.start.toISOString()}&to=${range.end.toISOString()}`);
                if (deviceRes.ok) {
                    const deviceJson = await deviceRes.json();
                    if (isMounted) setDeviceData(Array.isArray(deviceJson) ? deviceJson : []);
                }
            } catch (error) {
                console.error("Failed to fetch device data", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        if (orgId && range?.start && range?.end) {
            fetchData();
        }
        return () => { isMounted = false; };
    }, [orgId, range]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 h-96">
                <div className="flex flex-col items-center gap-4 text-gray-400">
                    <Loader2 size={32} className="animate-spin text-gray-300" />
                    <span className="text-sm font-medium">Analyse des performances...</span>
                </div>
            </div>
        )
    }

    const summary = data?.summary || {};
    const rawSeries = data?.series || [];

    // Aggregations for Chart (Channel Level) because Series is now Campaign Level
    const chartDataMap = new Map<string, any>();
    rawSeries.forEach((r: any) => {
        const key = r.channel || 'unknown';
        if (!chartDataMap.has(key)) chartDataMap.set(key, { channel: key, spend: 0, roas: 0, revenue: 0, conv: 0, count: 0 });
        const entry = chartDataMap.get(key);
        entry.spend += r.spend;
        entry.revenue += r.revenue_ads;
        entry.conv += r.conversions;
        entry.count += 1;
    });

    const chartData = Array.from(chartDataMap.values()).map(d => ({
        ...d,
        roas: d.spend > 0 ? d.revenue / d.spend : 0
    }));

    const CHANNEL_COLORS: Record<string, string> = {
        google_ads: '#4285F4', // Google Blue
        meta_ads: '#1877F2',   // Meta/FB Blue
        facebook: '#1877F2',   // Facebook Blue
        instagram: '#E1306C',  // Instagram Pink
        tiktok_ads: '#00F2EA', // TikTok Teal
        audience_net: '#606770',
        unknown: '#9CA3AF'
    };

    const hasData = summary.total_spend > 1;

    // Calculate Contribution (AdProfit) manually to ensure accuracy
    const adContribution = (summary.total_revenue_ads || 0) - (summary.total_spend || 0);

    if (!hasData) {
        return (
            <div className="p-8 w-full max-w-7xl mx-auto animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[60vh]">
                <EmptyState
                    title="Performance d'acquisition non détectée"
                    message="Sans données publicitaires, PILOT ne peut déterminer quelles campagnes génèrent du profit. Connectez vos comptes (Google Ads, Meta Ads) pour activer cette vue."
                    actionLabel="Connecter les comptes pubs"
                    actionUrl="/dashboard/connections"
                    secondaryText="Les données historiques seront importées automatiquement."
                    icon={<Megaphone size={40} className="text-gray-300" />}
                />
            </div>
        );
    }

    // Determine Winner Device
    const mobileData = deviceData.find(d => d.device === 'mobile') || { roas: 0, spend: 0 };
    const desktopData = deviceData.find(d => d.device === 'desktop') || { roas: 0, spend: 0 };
    const deviceWinner = mobileData.roas > desktopData.roas ? 'Mobile' : 'Desktop';
    const deviceRoasDiff = Math.abs(mobileData.roas - desktopData.roas).toFixed(2);

    return (
        <div className="p-6 w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pr-8">
            {/* KPI Row (Compact) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <KPICard title="Dépenses Pubs" value={formatCurrency(summary.total_spend)} loading={loading} />
                <KPICard title="ROAS Global" value={summary.roas_attributed ? summary.roas_attributed.toFixed(2) : '-'} loading={loading} />
                <KPICard title="Revenus Pubs" value={formatCurrency(summary.total_revenue_ads)} loading={loading} />
                <KPICard
                    title="Contribution Marge"
                    value={formatCurrency(adContribution)}
                    loading={loading}
                />
                <KPICard title="Marge / Pubs %" value={(adContribution && summary.total_revenue_ads) ? ((adContribution / summary.total_revenue_ads) * 100).toFixed(1) : '-'} suffix="%" loading={loading} />
            </div>

            {/* Charts Row (Height Reduced) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[300px]">
                {/* Spend Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Répartition des Dépenses</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                <XAxis type="number" tickFormatter={(val) => `€${val}`} hide />
                                <YAxis type="category" dataKey="channel" width={80} tickFormatter={(val) => val ? val.replace(/_/g, ' ') : ''} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} cursor={{ fill: '#f9fafb' }} />
                                <Bar dataKey="spend" radius={[0, 4, 4, 0]} name="Dépenses" barSize={24}>
                                    {chartData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={CHANNEL_COLORS[entry.channel] || CHANNEL_COLORS.unknown} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ROAS Comparison */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Comparatif ROAS</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="channel" tickFormatter={(val) => val ? val.replace(/_/g, ' ') : ''} tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={(val) => `${val}x`} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)}x`} cursor={{ fill: '#f9fafb' }} />
                                <ReferenceLine y={2.5} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'Target 2.5x', fill: '#10b981', fontSize: 10 }} />
                                <Bar dataKey="roas" radius={[4, 4, 0, 0]} name="ROAS" barSize={40}>
                                    {chartData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.roas > 2.5 ? '#10b981' : entry.roas > 1.5 ? '#f59e0b' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Coach Captain Insight (Device Analysis) */}
            {deviceData.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-bottom-2">
                    <div className="bg-indigo-600 p-3 rounded-full shadow-md shrink-0">
                        <Brain className="text-white" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                            Coach Captain : Analyse des Supports
                            {deviceWinner === 'Mobile' ? <Smartphone size={18} className="text-indigo-600" /> : <Monitor size={18} className="text-indigo-600" />}
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {deviceWinner === 'Mobile'
                                ? `Vos publicités performent mieux sur Mobile (ROAS ${mobileData.roas.toFixed(2)}x vs ${desktopData.roas.toFixed(2)}x). C'est le moment d'investir massivement sur les formats verticaux (Reels/Stories) et de vérifier la vitesse de votre site mobile.`
                                : `Le Desktop est votre moteur de rentabilité (ROAS ${desktopData.roas.toFixed(2)}x vs ${mobileData.roas.toFixed(2)}x). Votre audience préfère probablement le confort d'un grand écran pour convertir. Pensez au Retargeting Desktop.`}
                        </p>
                    </div>
                    {/* Mini Comparison */}
                    <div className="flex bg-white rounded-xl border border-gray-100 p-3 gap-6 shadow-sm shrink-0">
                        <div className={`flex flex-col items-center min-w-[60px] ${deviceWinner === 'Mobile' ? 'opacity-100 transform scale-105' : 'opacity-60'}`}>
                            <Smartphone size={20} className={deviceWinner === 'Mobile' ? 'text-indigo-600 mb-1' : 'text-gray-400 mb-1'} />
                            <span className="text-xs text-gray-500 font-medium">Mobile</span>
                            <span className={`font-bold ${deviceWinner === 'Mobile' ? 'text-indigo-700' : 'text-gray-600'}`}>{mobileData.roas.toFixed(2)}x</span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className={`flex flex-col items-center min-w-[60px] ${deviceWinner === 'Desktop' ? 'opacity-100 transform scale-105' : 'opacity-60'}`}>
                            <Monitor size={20} className={deviceWinner === 'Desktop' ? 'text-indigo-600 mb-1' : 'text-gray-400 mb-1'} />
                            <span className="text-xs text-gray-500 font-medium">Desktop</span>
                            <span className={`font-bold ${deviceWinner === 'Desktop' ? 'text-indigo-700' : 'text-gray-600'}`}>{desktopData.roas.toFixed(2)}x</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Deep Table: Campaign Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-gray-900">Performance par Campagne</h3>
                        <p className="text-xs text-gray-500 mt-1">Détail consolidé par campagne et canal</p>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm text-right relative border-collapse">
                        <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10 shadow-sm text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold w-1/4">Campagne / Canal</th>
                                <th className="px-6 py-3 font-semibold text-red-800">Dépenses</th>
                                <th className="px-6 py-3 font-semibold">Impr.</th>
                                <th className="px-6 py-3 font-semibold">Clics</th>
                                <th className="px-6 py-3 font-semibold">CTR</th>
                                <th className="px-6 py-3 font-semibold">CPC</th>
                                <th className="px-6 py-3 font-semibold">Ventes</th>
                                <th className="px-6 py-3 font-semibold">CPA</th>
                                <th className="px-6 py-3 font-semibold text-blue-600">ROAS</th>
                                <th className="px-6 py-3 font-semibold">Revenus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rawSeries.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-3 text-left font-medium text-gray-900">
                                        <div className="flex flex-col">
                                            <span className="font-bold truncate max-w-[200px]" title={row.campaign}>{row.campaign || 'Global'}</span>
                                            <span className="text-xs text-gray-400 capitalize flex items-center gap-1">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: CHANNEL_COLORS[row.channel] || CHANNEL_COLORS.unknown }}
                                                ></div>
                                                {row.channel ? row.channel.replace(/_/g, ' ') : 'Inconnu'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-red-800/80">{formatCurrency(row.spend)}</td>
                                    <td className="px-6 py-3 text-gray-500">{formatNumber(row.impressions)}</td>
                                    <td className="px-6 py-3 text-gray-500">{formatNumber(row.clicks)}</td>
                                    <td className="px-6 py-3 text-gray-500">{row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : 0}%</td>
                                    <td className="px-6 py-3 text-gray-500">{formatCurrency(row.clicks > 0 ? row.spend / row.clicks : 0)}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{row.conversions}</td>
                                    <td className="px-6 py-3 font-medium">{formatCurrency(row.cpa)}</td>
                                    <td className="px-6 py-3 font-bold text-blue-600">{row.roas?.toFixed(2) || 0}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{formatCurrency(row.revenue_ads)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
