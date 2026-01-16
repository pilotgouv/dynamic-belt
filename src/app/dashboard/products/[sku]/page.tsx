
'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Package, ArrowLeft, TrendingUp, AlertTriangle, Layers, ShoppingBag } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProductDetailView() {
    const { range } = useDateRange();
    const router = useRouter();
    const params = useParams();
    const sku = params.sku as string;

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
                const response = await fetch(`/api/products/${sku}?${query}`);
                const result = await response.json();
                if (isMounted) setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        if (sku && range) fetchData();
        return () => { isMounted = false; };
    }, [sku, range]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(val);

    if (loading) {
        return <div className="p-8 h-screen flex items-center justify-center"><div className="animate-spin text-gray-400">Loading...</div></div>;
    }

    if (!data) return <div className="p-8 text-center text-gray-500">Produit introuvable</div>;

    const { summary, series, channels, waterfall, meta, insights } = data;

    // Waterfall Data Prep
    const waterfallChartData = [
        { name: 'Revenue', value: waterfall.revenue },
        { name: 'Refunds', value: -waterfall.refunds },
        { name: 'Costs', value: -(waterfall.cogs + waterfall.fees + waterfall.marketing) }, // Combined for simplicity or separate
        { name: 'Profit', value: waterfall.profit, isTotal: true }
    ];

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/products" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                        {meta?.imageUrl ? <img src={meta.imageUrl} className="w-full h-full object-cover" /> : <Package size={24} className="text-gray-400" />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{meta?.title || meta?.name || sku}</h1>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-gray-500">{sku}</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold text-gray-600">{meta?.providerPrimary || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW A: KPIs Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPICard title="Contribution Profit" value={formatCurrency(summary.profit)} suffix={` (${summary.margin.toFixed(1)}%)`} loading={loading} />
                <KPICard title="Revenue Total" value={formatCurrency(summary.revenue)} loading={loading} />
                <KPICard title="Unités Vendues" value={summary.units} loading={loading} />
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
                    <h3 className="text-xs text-gray-400 font-bold uppercase mb-2">Statut</h3>
                    <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {summary.margin > 20 ? <span className="text-green-600 flex items-center gap-1"><TrendingUp size={18} /> Rentable</span> :
                            summary.margin > 0 ? <span className="text-yellow-600 flex items-center gap-1">Faible Marge</span> :
                                <span className="text-red-600 flex items-center gap-1"><AlertTriangle size={18} /> Critique</span>}
                    </div>
                </div>
            </div>

            {/* ROW B: Charts (Time Series & Channels) */}
            <div className="grid grid-cols-12 gap-6 h-[400px]">
                {/* Main Chart */}
                <div className="col-span-12 md:col-span-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-4">Performance Temporelle</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={series}>
                                <defs>
                                    <linearGradient id="colorProdProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} />
                                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#94a3b8" fill="none" strokeWidth={2} name="CA" />
                                <Area yAxisId="left" type="monotone" dataKey="profit" stroke="#10b981" fill="url(#colorProdProfit)" strokeWidth={3} name="Profit" />
                                <Area yAxisId="right" type="monotone" dataKey="units" stroke="#3b82f6" fill="none" strokeDasharray="5 5" name="Unités" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Channel Split */}
                <div className="col-span-12 md:col-span-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm overflow-y-auto">
                    <h3 className="font-bold text-gray-900 mb-4">Mix Canaux</h3>
                    <div className="space-y-4">
                        {channels.map((ch: any, i: number) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="font-bold text-gray-700 capitalize">{ch.channel.toLowerCase().replace('_', ' ')}</div>
                                    <div className="text-xs bg-white border px-2 py-0.5 rounded font-mono">{ch.units} units</div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">CA</span>
                                    <span className="font-medium">{formatCurrency(ch.revenue)}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-500">Marge</span>
                                    <span className={`font-bold ${ch.profit > 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(ch.profit)}</span>
                                </div>
                            </div>
                        ))}
                        {channels.length === 0 && <div className="text-sm text-gray-400 italic">Aucune donnée canal disponible.</div>}
                    </div>
                </div>
            </div>

            {/* ROW C: Analysis & Coach */}
            <div className="grid grid-cols-12 gap-6">
                {/* Waterfall */}
                <div className="col-span-12 md:col-span-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Layers size={18} className="text-gray-400" /> Décomposition Profit</h3>
                    <div className="space-y-3">
                        <WaterfallRow label="Chiffre d'Affaires Brut" value={waterfall.revenue} isBase />
                        <WaterfallRow label="Remboursements" value={-waterfall.refunds} isNegative />
                        <WaterfallRow label="Coûts Marchandises (COGS)" value={-waterfall.cogs} isNegative />
                        <WaterfallRow label="Frais Plateforme & Mkt" value={-waterfall.fees} isNegative />
                        <div className="border-t pt-3 mt-2">
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Profit Réel</span>
                                <span className={waterfall.profit > 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(waterfall.profit)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Coach */}
                <div className="col-span-12 md:col-span-6 bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100 shadow-sm">
                    <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">🧠 AI Insights</h3>
                    <ul className="space-y-3">
                        {insights.map((ins: any, i: number) => (
                            <li key={i} className={`text-sm p-3 rounded-lg border ${ins.type === 'danger' ? 'bg-red-50 border-red-200 text-red-700' :
                                    ins.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                        'bg-green-50 border-green-200 text-green-700'
                                }`}>
                                {ins.text}
                            </li>
                        ))}
                        <li className="text-sm text-gray-600 p-3 italic">
                            💡 Conseil: {summary.margin < 15 ?
                                "La marge est faible. Essayez d'augmenter le prix de vente ou de réduire les coûts d'acquisition sur ce produit spécifique." :
                                "Produit sain. Envisagez d'augmenter le budget pub sur les canaux performants."}
                        </li>
                    </ul>
                </div>
            </div>

        </div>
    );
}

function WaterfallRow({ label, value, isNegative, isBase }: any) {
    const val = value || 0;
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{label}</span>
            <span className={`font-mono font-medium ${isNegative ? 'text-red-500' : isBase ? 'text-gray-900' : 'text-gray-900'}`}>
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val)}
            </span>
        </div>
    )
}
