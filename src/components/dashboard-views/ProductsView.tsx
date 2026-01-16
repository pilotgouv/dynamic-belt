'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package, TrendingUp, AlertTriangle, ArrowRight, ShieldAlert, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductsViewProps {
    orgId: string;
}

export default function ProductsView({ orgId }: ProductsViewProps) {
    const { range } = useDateRange();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            setLoading(true);
            try {
                const query = new URLSearchParams({
                    start: range.start.toISOString(),
                    end: range.end.toISOString()
                });
                const response = await fetch(`/api/products?${query}`);
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

    if (!loading && (!data || data.products.length === 0)) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <EmptyState
                    title="Aucun produit analysé"
                    message="Synchronisez vos sources (Shopify, Amazon) pour voir apparaître vos produits et leur rentabilité réelle."
                    actionLabel="Connecter une source"
                    actionUrl="/dashboard/connections"
                    icon={<Package size={32} />}
                />
            </div>
        );
    }

    const summary = data?.summary || {};
    const products = data?.products || [];

    // Top Hero used for banner if needed, or just list. User spec focused on Table + Header KPIs.
    // I will stick to clean Listing Layout.

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">

            {/* ROW A: KPIs V2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Total SKUs Sold" value={summary.totalSkus} loading={loading} />
                <KPICard title="Hero Products" value={summary.heroCount} loading={loading} description="Génèrent >5% du CA global" />
                <KPICard title="Top SKU Profit Share" value={summary.topSkuProfitShare ? summary.topSkuProfitShare.toFixed(1) : '-'} suffix="%" loading={loading} />
                <KPICard title="Marge Moyenne" value={summary.avgMargin ? summary.avgMargin.toFixed(1) : '-'} suffix="%" loading={loading} />
            </div>

            {/* ROW B: PRODUCTS TABLE */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Package size={18} className="text-gray-400" /> Performance Produit
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Produit</th>
                                <th className="px-6 py-4">SKU / Status</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4 text-right">Unités</th>
                                <th className="px-6 py-4 text-right">CA</th>
                                <th className="px-6 py-4 text-right">Vrai Profit</th>
                                <th className="px-6 py-4 text-right">Marge %</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.map((p: any, i: number) => (
                                <tr
                                    key={i}
                                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/dashboard/products/${p.sku}`)}
                                >
                                    <td className="px-6 py-4 max-w-[300px]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                                {p.imageUrl ?
                                                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> :
                                                    <Package size={16} className="text-gray-400" />
                                                }
                                            </div>
                                            <div className="truncate font-medium text-gray-900" title={p.name}>{p.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-gray-500 text-xs mb-1">{p.sku}</div>
                                        {p.statusTag === 'HERO' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700"><Star size={10} /> HERO</span>}
                                        {p.statusTag === 'RISK' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700"><ShieldAlert size={10} /> RISK</span>}
                                        {p.statusTag === 'VOLUME' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">VOLUME</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded border border-gray-200 text-xs font-semibold text-gray-600 bg-gray-50 capitalize">
                                            {p.provider ? p.provider.toLowerCase().replace('_', ' ') : 'Manual'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">{p.units}</td>
                                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.revenue)}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${p.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(p.profit)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={`text-xs font-bold ${p.margin >= 20 ? 'text-gray-700' : 'text-red-500'}`}>
                                                {p.margin.toFixed(1)}%
                                            </span>
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${p.margin >= 20 ? 'bg-green-500' : p.margin > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(100, Math.max(0, p.margin))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-300 group-hover:text-blue-500 transition-colors">
                                        <ArrowRight size={18} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {products.length > 20 && (
                    <div className="p-4 border-t border-gray-100 text-center text-sm text-gray-500">
                        Affichage des top 20 SKUs...
                    </div>
                )}
            </div>
        </div>
    );
}
