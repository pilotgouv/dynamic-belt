'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wallet, Loader2 } from 'lucide-react';
import FinanceDetailSheet from '@/components/FinanceDetailSheet';

interface FinanceViewProps {
    orgId: string;
}

export default function FinanceView({ orgId }: FinanceViewProps) {
    const { range } = useDateRange();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [detailType, setDetailType] = useState<'shipping' | 'fees' | 'ads' | 'cogs' | 'profit' | null>(null);

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

    const isStrictZeroCogs = data?.confidence === 'EXACT' && summary.total_cogs === 0 && summary.total_revenue > 0;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Detail Sheet */}
            <FinanceDetailSheet
                visible={!!detailType}
                onClose={() => setDetailType(null)}
                type={detailType}
                range={range}
                orgId={orgId}
            />

            {/* Strict Mode Safety Warning */}
            {isStrictZeroCogs && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between text-red-800 shadow-sm animate-pulse-slow">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-200 p-2 rounded-full"><Wallet size={20} className="text-red-700" /></div>
                        <div>
                            <span className="font-bold flex items-center gap-2">Attention : Mode Strict activé mais aucun coût détecté.</span>
                            <p className="text-sm opacity-90 mt-0.5">Vos profits affichés sont bruts car aucun COGS n'a été trouvé. Veuillez ajouter des coûts à vos produits ou passer en mode Estimation.</p>
                        </div>
                    </div>
                    <a href="/dashboard/settings" className="px-4 py-2 bg-white border border-red-200 text-red-700 font-bold text-sm rounded hover:bg-red-50 transition-colors">
                        Modifier
                    </a>
                </div>
            )}

            {/* KPI Row */}
            <div className="grid grid-cols-5 gap-4">
                <KPICard title="Ventes Brutes" value={summary.total_revenue ? formatCurrency(summary.total_revenue) : '-'} loading={loading} />
                <KPICard title="CA Net" value={summary.total_revenue_net ? formatCurrency(summary.total_revenue_net) : '-'} loading={loading} />
                <KPICard title="Coûts (COGS)" value={summary.total_cogs ? formatCurrency(summary.total_cogs) : '-'} loading={loading} />
                <KPICard title="Vrai Profit" value={summary.total_profit ? formatCurrency(summary.total_profit) : '-'} loading={loading} />
                <KPICard title="Marge %" value={summary.global_margin ? summary.global_margin.toFixed(1) : '-'} suffix="%" loading={loading} />
            </div>

            {/* Profitability Waterfall Overview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-6">Décomposition de la Profitabilité</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left: Waterfall List */}
                    <div className="space-y-4">
                        <WaterfallItem label="Chiffre d'Affaires Brut" value={summary.total_revenue} color="text-gray-900" bg="bg-gray-100" />
                        <WaterfallItem label="Remboursements" value={summary.total_refunds} isNegative color="text-red-500" bg="bg-red-50" indent />

                        <WaterfallItem
                            label="Coût des Marchandises (COGS)"
                            value={summary.total_cogs}
                            isNegative color="text-red-600" bg="bg-red-50" indent
                            onClick={() => setDetailType('cogs')}
                            clickable
                        />

                        <WaterfallItem
                            label="Dépenses Publicitaires (Ads)"
                            value={summary.total_spend}
                            isNegative color="text-purple-600" bg="bg-purple-50" indent
                            onClick={() => setDetailType('ads')}
                            clickable
                        />

                        <WaterfallItem
                            label="Frais de Livraison"
                            value={summary.total_shipping}
                            isNegative color="text-orange-600" bg="bg-orange-50" indent
                            onClick={() => setDetailType('shipping')}
                            clickable
                        />

                        <WaterfallItem
                            label="Frais de Transaction"
                            value={summary.total_fees}
                            isNegative color="text-amber-600" bg="bg-amber-50" indent
                            onClick={() => setDetailType('fees')}
                            clickable
                        />

                        <div className="pt-4 border-t mt-2">
                            <div className="flex justify-between items-center rounded-xl bg-green-50 p-4 border border-green-100">
                                <span className="font-bold text-green-900">Vrai Profit (Net)</span>
                                <span className="font-bold text-2xl text-green-700">{formatCurrency(summary.total_profit || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Ratios */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div className="p-6 rounded-xl bg-blue-50 border border-blue-100">
                            <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-2">Efficiency Ratio (MER)</h4>
                            <div className="text-3xl font-bold text-blue-700">
                                {summary.total_spend > 0 ? (summary.total_revenue / summary.total_spend).toFixed(2) : '-'}x
                            </div>
                            <p className="text-xs text-blue-600 mt-1">Pour 1€ dépensé en pub, vous générez {summary.total_spend > 0 ? (summary.total_revenue / summary.total_spend).toFixed(2) : '0'}€ de CA.</p>
                        </div>
                        <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Poids des Coûts</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>COGS</span>
                                    <span className="font-mono text-gray-700">{summary.total_revenue > 0 ? ((summary.total_cogs / summary.total_revenue) * 100).toFixed(1) : '0.0'}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pubs</span>
                                    <span className="font-mono text-gray-700">{summary.total_revenue > 0 ? ((summary.total_spend / summary.total_revenue) * 100).toFixed(1) : '0.0'}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                                <th className="px-6 py-4 font-semibold text-red-800">Livraison</th>
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
                                    <td className="px-6 py-4 text-red-800/70">-{formatCurrency(row.shipping || 0)}</td>
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

function WaterfallItem({ label, value, isNegative, color, bg, indent, onClick, clickable }: any) {
    const val = value || 0;
    return (
        <div
            onClick={clickable ? onClick : undefined}
            className={`flex justify-between items-center p-3 rounded-lg ${bg || 'bg-white'} ${indent ? 'ml-6' : ''} ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-100 transition-all active:scale-[0.99]' : ''}`}
        >
            <span className={`font-medium ${color || 'text-gray-900'} flex items-center gap-2`}>
                {label} {clickable && <span className="text-[10px] bg-white/50 px-1.5 rounded border border-gray-200/50">Détail</span>}
            </span>
            <span className={`font-bold font-mono ${color || 'text-gray-900'}`}>
                {isNegative ? '-' : ''}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val)}
            </span>
        </div>
    )
}
