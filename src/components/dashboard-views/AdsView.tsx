'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Megaphone, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AdsViewProps {
    orgId: string;
}

export default function AdsView({ orgId }: AdsViewProps) {
    const { range } = useDateRange();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            setLoading(true);
            try {
                const response = await fetch('/api/reports/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        organizationId: orgId,
                        config: {
                            metrics: ["spend", "impressions", "clicks", "roas", "cpa", "contribution"],
                            dimensions: ["channel"], // Request Channel Grouping
                        },
                        range: range
                    })
                });
                const result = await response.json();
                if (isMounted) setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        if (orgId && range) fetchData();
        return () => { isMounted = false; };
    }, [orgId, range]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(val);
    const formatNumber = (val: number) => new Intl.NumberFormat('fr-FR').format(val);

    const summary = data?.summary || {};
    const chartData = data?.series || [];

    // Empty State Check
    if (!loading && chartData.length === 0) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <EmptyState
                    title="Performance d'acquisition non détectée"
                    message="Sans données publicitaires, PILOT ne peut déterminer quelles campagnes génèrent du profit — ou gâchent de la marge. Connectez vos comptes publicitaires pour mesurer le ROAS, CPA et la vraie rentabilité."
                    actionLabel="Connecter les comptes pubs"
                    actionUrl="/dashboard/connections"
                    secondaryText="Des pubs sans tracking créent des angles morts dans l'analyse de profit."
                    icon={<Megaphone size={32} />}
                />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* KPI Row */}
            <div className="grid grid-cols-5 gap-4">
                <KPICard title="Dépenses Pubs" value={summary.total_spend ? formatCurrency(summary.total_spend) : '-'} loading={loading} />
                <KPICard title="ROAS Global" value={summary.roas ? summary.roas.toFixed(2) : '-'} loading={loading} />
                <KPICard title="Revenus Pubs" value={summary.total_revenue ? formatCurrency(summary.total_revenue) : '-'} loading={loading} />
                <KPICard title="Contribution Marge" value={summary.total_profit ? formatCurrency(summary.total_profit) : '-'} loading={loading} />
                <KPICard title="Marge / Pubs %" value={(summary.total_profit && summary.total_revenue) ? ((summary.total_profit / summary.total_revenue) * 100).toFixed(1) : '-'} suffix="%" loading={loading} />
            </div>

            {/* Deep Table: Channel Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-gray-900">Performance par Canal</h3>
                        <p className="text-xs text-gray-500 mt-1">Rentabilité par source d'acquisition</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right relative border-collapse">
                        <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10 shadow-sm text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">Canal</th>
                                <th className="px-6 py-4 font-semibold text-red-800">Dépenses</th>
                                <th className="px-6 py-4 font-semibold">Impr.</th>
                                <th className="px-6 py-4 font-semibold">Clics</th>
                                <th className="px-6 py-4 font-semibold">CTR</th>
                                <th className="px-6 py-4 font-semibold">CPC</th>
                                <th className="px-6 py-4 font-semibold">Ventes</th>
                                <th className="px-6 py-4 font-semibold">CPA</th>
                                <th className="px-6 py-4 font-semibold text-blue-600">ROAS</th>
                                <th className="px-6 py-4 font-semibold">Revenus</th>
                                <th className="px-6 py-4 font-semibold text-green-700 bg-green-50/30 border-l border-green-100">Contribution</th>
                                <th className="px-6 py-4 font-semibold text-green-800">Contrib. %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {chartData.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 text-left font-medium text-gray-900 capitalize">
                                        <div className="flex items-center gap-2">
                                            {/* Simple Icon Logic */}
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            {row.channel.replace(/_/g, ' ')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-red-800/80">{formatCurrency(row.spend)}</td>
                                    <td className="px-6 py-4 text-gray-500">{formatNumber(row.impressions)}</td>
                                    <td className="px-6 py-4 text-gray-500">{formatNumber(row.clicks)}</td>
                                    <td className="px-6 py-4 text-gray-500">{row.ctr.toFixed(2)}%</td>
                                    <td className="px-6 py-4 text-gray-500">{formatCurrency(row.cpc)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{row.conversions}</td>
                                    <td className="px-6 py-4 font-medium">{formatCurrency(row.cpa)}</td>
                                    <td className="px-6 py-4 font-bold text-blue-600">{row.roas.toFixed(2)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(row.revenue)}</td>
                                    <td className={`px-6 py-4 font-bold border-l border-green-50 bg-green-50/10 ${row.contribution > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(row.contribution)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${row.contribution_margin >= 30 ? 'bg-green-100 text-green-700' :
                                                row.contribution_margin > 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {row.contribution_margin.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
