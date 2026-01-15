'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlertTriangle, Package, Loader2, Trophy } from 'lucide-react';
// import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ProductsViewProps {
    orgId: string;
}

export default function ProductsView({ orgId }: ProductsViewProps) {
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
                            metrics: ["revenue", "profit", "units_sold", "margin_percent"],
                            dimensions: ["date"], // We rely on Context for Product Breakdown
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
    const heroProducts = data?.context?.heroProducts || [];

    // Identify The Hero (Rank #1)
    const topHero = heroProducts.length > 0 ? heroProducts[0] : null;

    if (!loading && heroProducts.length === 0) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <EmptyState
                    title="Intelligence produit non initialisée"
                    message="La vue Produits identifie vos Hero SKUs, la concentration de profit et les risques de marge. Une fois synchronisé, chaque produit et variante sera analysé individuellement — y compris le vrai profit."
                    actionLabel="Synchroniser les produits"
                    actionUrl="/dashboard/connections"
                    secondaryText="Chaque variante est suivie séparément par SKU pour assurer une précision optimale."
                    icon={<Package size={32} />}
                />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

            {/* ROW A: HERO BAND */}
            {topHero && (
                <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-gray-800 to-transparent opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold tracking-wider text-xs uppercase">
                                <Trophy size={14} /> Hero Product of the Period
                            </div>
                            <h1 className="text-3xl font-bold mb-1">{topHero.name}</h1>
                            <div className="text-gray-400 font-mono text-sm mb-6">{topHero.sku || 'No SKU'}</div>

                            <div className="flex items-center gap-8">
                                <div>
                                    <div className="text-gray-400 text-xs uppercase font-bold mb-1">Revenue</div>
                                    <div className="text-2xl font-bold">{formatCurrency(topHero.revenue)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-xs uppercase font-bold mb-1">Profit (Est)</div>
                                    <div className="text-2xl font-bold text-green-400">{formatCurrency(topHero.profit_estimated)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-xs uppercase font-bold mb-1">Units</div>
                                    <div className="text-2xl font-bold">{topHero.units}</div>
                                </div>
                            </div>
                        </div>
                        {/* Image Placeholder */}
                        <div className="w-32 h-32 bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center text-gray-600">
                            <Package size={48} />
                        </div>
                    </div>
                </div>
            )}

            {/* ROW B: KPI Cards */}
            <div className="grid grid-cols-4 gap-6">
                <KPICard title="Total Units Sold" value={summary.total_units_sold || 0} loading={loading} />
                <KPICard title="Product Revenue" value={summary.total_revenue ? formatCurrency(summary.total_revenue) : '-'} loading={loading} />
                <KPICard title="Product Profit" value={summary.total_profit ? formatCurrency(summary.total_profit) : '-'} loading={loading} />
                <KPICard title="Avg Margin" value={summary.global_margin ? summary.global_margin.toFixed(1) : '-'} suffix="%" loading={loading} />
            </div>

            {/* ROW C: Top SKUs Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Top Performing SKUs</h3>
                    <span className="text-xs text-gray-400">Sort by Revenue</span>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4">Product Name</th>
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4 text-right">Units</th>
                            <th className="px-6 py-4 text-right">Revenue</th>
                            <th className="px-6 py-4 text-right">Profit (Est)</th>
                            <th className="px-6 py-4 text-right">Share</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div></td></tr>
                            ))
                        ) : heroProducts.map((p: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                <td className="px-6 py-4 font-mono text-gray-400 text-xs">{p.sku}</td>
                                <td className="px-6 py-4 text-right">{p.units}</td>
                                <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.revenue)}</td>
                                <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(p.profit_estimated)}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">
                                        {((p.revenue / (summary.total_revenue || 1)) * 100).toFixed(0)}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
