'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wallet, Loader2 } from 'lucide-react';

interface FinanceViewProps {
    orgId: string;
}

export default function FinanceView({ orgId }: FinanceViewProps) {
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
                            metrics: ["revenue_gross", "revenue_net", "refunds", "cogs", "fees", "profit", "margin_percent"],
                            dimensions: ["date"],
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

    const summary = data?.summary || {};
    const chartData = data?.series || [];

    // Empty State Check
    if (!loading && chartData.length === 0) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <EmptyState
                    title="La clarté financière commence ici"
                    message="La vue Finance calcule votre vrai profit en combinant revenus, coûts, frais et dépenses d'acquisition. Connectez votre boutique et vos sources de coûts pour voir où l'argent est réellement gagné."
                    actionLabel="Connecter la boutique"
                    actionUrl="/dashboard/connections"
                    secondaryText="PILOT n'estime pas les profits. Tous les chiffres sont calculés à partir de transactions réelles."
                    icon={<Wallet size={32} />}
                />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* KPI Row */}
            <div className="grid grid-cols-5 gap-4">
                <KPICard title="Ventes Brutes" value={summary.total_revenue ? formatCurrency(summary.total_revenue) : '-'} loading={loading} />
                <KPICard title="CA Net" value={summary.total_revenue_net ? formatCurrency(summary.total_revenue_net) : '-'} loading={loading} />
                <KPICard title="Coûts (COGS)" value={summary.total_cogs ? formatCurrency(summary.total_cogs) : '-'} loading={loading} />
                <KPICard title="Vrai Profit" value={summary.total_profit ? formatCurrency(summary.total_profit) : '-'} loading={loading} />
                <KPICard title="Marge %" value={summary.global_margin ? summary.global_margin.toFixed(1) : '-'} suffix="%" loading={loading} />
            </div>

            {/* Deep Table: Daily Financials */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-gray-900">Détail Quotidien</h3>
                        <p className="text-xs text-gray-500 mt-1">Flux de trésorerie jour par jour</p>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm text-right relative border-collapse">
                        <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10 shadow-sm text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Cmmdes</th>
                                <th className="px-6 py-4 font-semibold">CA Brut</th>
                                <th className="px-6 py-4 font-semibold text-red-400">Remb.</th>
                                <th className="px-6 py-4 font-semibold text-gray-900 bg-gray-50/80 border-l border-r border-gray-100">CA Net</th>
                                <th className="px-6 py-4 font-semibold text-red-800">COGS</th>
                                <th className="px-6 py-4 font-semibold text-red-800">Pubs</th>
                                <th className="px-6 py-4 font-semibold text-red-800">Frais</th>
                                <th className="px-6 py-4 font-semibold text-green-700 bg-green-50/30 border-l border-green-100">Vrai Profit</th>
                                <th className="px-6 py-4 font-semibold text-green-800">Marge %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[...chartData].reverse().map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 text-left font-mono text-gray-600 text-xs">
                                        {new Date(row.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{row.orders}</td>
                                    <td className="px-6 py-4 font-medium">{formatCurrency(row.revenue_gross)}</td>
                                    <td className="px-6 py-4 text-red-400">{row.refunds > 0 ? `-${formatCurrency(row.refunds)}` : '-'}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900 bg-gray-50/30 border-l border-r border-gray-100">
                                        {formatCurrency(row.revenue_net)}
                                    </td>
                                    <td className="px-6 py-4 text-red-800/70">-{formatCurrency(row.cogs)}</td>
                                    <td className="px-6 py-4 text-red-800/70">-{formatCurrency(row.spend)}</td>
                                    <td className="px-6 py-4 text-red-800/70">-{formatCurrency(row.fees)}</td>
                                    <td className={`px-6 py-4 font-bold border-l border-green-50 bg-green-50/10 ${row.profit_estimated > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(row.profit_estimated)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${row.margin_percent >= 20 ? 'bg-green-100 text-green-700' :
                                            row.margin_percent > 0 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {row.margin_percent.toFixed(1)}%
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
