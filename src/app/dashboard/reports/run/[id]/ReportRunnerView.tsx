"use client";

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Download, AlertCircle, TrendingUp, Package, Trophy, AlertTriangle, Layers } from 'lucide-react';
import Link from 'next/link';
import { useDateRange } from '@/context/DateRangeContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

interface ReportRunnerViewProps {
    report: any;
    orgId: string;
}

const THEME = {
    bg: '#f8f9fa',
    card: '#ffffff',
    text: '#1a1a1a',
    subtext: '#888888',
    primary: '#007AFF',
    border: '#e1e1e1',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    shadow: '0 4px 20px rgba(0,0,0,0.03)'
};

export default function ReportRunnerView({ report, orgId }: ReportRunnerViewProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial Config
    const config = typeof report.config === 'string' ? JSON.parse(report.config) : report.config;
    // Detect Product Mode
    const isProductView = report.name.includes('Produit') || config.dimensions?.includes('product_name');

    // Date State
    // Date State (Global)
    const { range } = useDateRange();

    // Auto-run on mount & range change
    useEffect(() => {
        if (!range.start || !range.end) return; // simple valid check

        const controller = new AbortController();
        run(controller.signal);
        return () => controller.abort();
    }, [range.start, range.end]);

    const run = async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/reports/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: orgId,
                    reportDefinitionId: report.id,
                    config: config,
                    range: range
                }),
                signal
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to run report');
            }
            const jsonData = await res.json();
            if (!signal?.aborted) {
                setData(jsonData);
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                setError(e.message);
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    // Date Presets Handler


    // --- RENDERERS ---

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Generating Report</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button onClick={() => run()} className="px-4 py-2 bg-black text-white rounded-lg">Retry</button>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: THEME.bg, padding: '2rem', fontFamily: 'var(--font-sans)' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                {/* HEADER & CONTROLS */}
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Link href="/dashboard/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: THEME.subtext, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            <ArrowLeft size={16} /> Retour aux rapports
                        </Link>
                        {/* Title Removed for cleaner Global Header Integration */}
                        <p style={{ color: THEME.subtext, marginTop: '0.25rem' }}>
                            {isProductView ? 'Intelligence Produit & Rentabilité' : 'Performance Financière & Croissance'}
                        </p>
                    </div>

                    {/* Global Date Control is now in DashboardHeader */}
                </header>

                <div style={{ position: 'relative', minHeight: '400px' }}>
                    {/* LOADING OVERLAY */}
                    {loading && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10,
                            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px'
                        }}>
                            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #eee', borderTop: '3px solid #000', borderRadius: '50%' }}></div>
                        </div>
                    )}

                    {!data ? (
                        <div style={{ opacity: 0 }}></div>
                    ) : (
                        <>
                            {/* KPI GRID */}
                            {!isProductView ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <SummaryCard title="Chiffre d'Affaires" value={data.summary.total_revenue} type="currency" />
                                    <SummaryCard title="Dépenses Ads" value={data.summary.total_spend} type="currency" negate />
                                    <SummaryCard title="Profit Net (Réel)" value={data.summary.total_profit} type="currency" highlight />
                                    <SummaryCard title="Marge Globale" value={data.summary.global_margin} type="percent" />
                                </div>
                            ) : (
                                // PRODUCT SPECIFIC KPI
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <ProductHeroCard title="Produit Hero" data={data.series[0]} icon={<Trophy color="#FFD700" />} />
                                    <div style={{ background: THEME.card, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
                                        <h4 style={{ color: THEME.subtext, fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Volume Total</h4>
                                        <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                                            {data.series.reduce((acc: number, r: any) => acc + (r.units_sold || 0), 0)} <span style={{ fontSize: '1rem', color: THEME.subtext, fontWeight: 500 }}>unités</span>
                                        </div>
                                    </div>
                                    <div style={{ background: THEME.card, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
                                        <h4 style={{ color: THEME.subtext, fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Produits Actifs</h4>
                                        <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                                            {data.series.filter((r: any) => r.units_sold > 0).length} <span style={{ fontSize: '1rem', color: THEME.subtext, fontWeight: 500 }}>SKUs</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LAYER 2: DRIVERS (Executive View) */}
                            {!isProductView && data.context && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                    {/* CHANNELS DRIVER */}
                                    <div style={{ background: THEME.card, padding: '1.5rem', borderRadius: '20px', border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <TrendingUp size={16} color={THEME.primary} /> Sources d'Acquisition
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {data.context.topChannels.map((c: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <div style={{ fontWeight: 500 }}>{c.channel || 'Direct/Unknown'}</div>
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        <span style={{ color: THEME.subtext }}>{formatCurrency(c.spend)}</span>
                                                        <span style={{ fontWeight: 600, color: c.roas > 2.5 ? THEME.success : THEME.warning }}>ROAS {c.roas.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* HERO PRODUCTS DRIVER */}
                                    {/* HERO PRODUCTS DRIVER */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-5">
                                            <div className="p-2 bg-amber-50 rounded-lg">
                                                <Trophy size={18} className="text-amber-600" />
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Impact Produits Hero</h3>
                                        </div>
                                        <div className="space-y-5">
                                            {data.context.heroProducts.map((p: any, i: number) => {
                                                const total = data.summary.total_revenue || 1;
                                                const share = (p.revenue / total) * 100;
                                                return (
                                                    <div key={i} className="group">
                                                        <div className="flex justify-between items-center text-sm mb-2">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-gray-800 truncate max-w-[180px]" title={p.name}>{p.name}</span>
                                                                {p.sku && <span className="text-xs text-gray-400 font-mono">{p.sku}</span>}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-gray-900">{formatCurrency(p.revenue)}</span>
                                                                <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                                                                    {share.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ width: `${Math.min(share, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MAIN SPLIT: CHART + TABLE */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {/* CHART */}
                                    <div style={{ background: THEME.card, borderRadius: '20px', padding: '1.5rem', border: `1px solid ${THEME.border}`, height: '420px', boxShadow: THEME.shadow }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                                            {isProductView ? 'Top 10 Produits (Revenus)' : 'Évolution des Profits'}
                                        </h3>
                                        <ResponsiveContainer width="100%" height="100%">
                                            {isProductView ? (
                                                <BarChart data={data.series.slice(0, 10)}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                                    <XAxis dataKey="product_name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} height={60} />
                                                    <YAxis tick={{ fontSize: 12, fill: THEME.subtext }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: THEME.subtext }} axisLine={false} tickLine={false} />
                                                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                                                    <Bar dataKey="revenue_gross" name="CA" fill="#1a1a1a" radius={[6, 6, 0, 0]} barSize={40} />
                                                    <Bar dataKey="units_sold" name="Unités" fill="#007AFF" radius={[6, 6, 0, 0]} yAxisId="right" barSize={20} />
                                                </BarChart>
                                            ) : (
                                                <AreaChart data={data.series}>
                                                    <defs>
                                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={THEME.success} stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor={THEME.success} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: THEME.subtext, fontSize: 12 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: THEME.subtext, fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                                                    <Legend iconType="circle" />
                                                    <Area type="monotone" dataKey="revenue_gross" name="Revenus" stroke="#1a1a1a" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" dot={false} activeDot={{ r: 6 }} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }} />
                                                    <Area type="monotone" dataKey="profit_estimated" name="Profit Net" stroke={THEME.success} strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" dot={false} activeDot={{ r: 6 }} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }} />
                                                </AreaChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>

                                    {/* DATA TABLE (Luxe Style) */}
                                    <div style={{ background: THEME.card, borderRadius: '20px', padding: '0', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: THEME.shadow }}>
                                        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${THEME.border}` }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Données Détaillées</h3>
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                <thead style={{ background: '#fcfcfc', borderBottom: `1px solid ${THEME.border}` }}>
                                                    <tr style={{ color: THEME.subtext, textAlign: 'right' }}>
                                                        <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontWeight: 600 }}>{isProductView ? 'Produit / SKU' : 'Date'}</th>
                                                        <th style={{ padding: '1rem', fontWeight: 600 }}>CA Brut</th>
                                                        {!isProductView && <th style={{ padding: '1rem', fontWeight: 600 }}>Ads</th>}
                                                        <th style={{ padding: '1rem', fontWeight: 600 }}>Profit</th>
                                                        <th style={{ padding: '1rem', fontWeight: 600 }}>Marge %</th>
                                                        {isProductView && <th style={{ padding: '1rem', fontWeight: 600 }}>Unités</th>}
                                                        {isProductView && <th style={{ padding: '1rem', fontWeight: 600 }}>Statut</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.series.slice(0, 5000).map((row: any, i: number) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.2s' }}>
                                                            <td style={{ textAlign: 'left', padding: '1rem 1.5rem', fontWeight: 500, color: THEME.text }}>
                                                                {isProductView ? (
                                                                    <div>
                                                                        <div style={{ fontWeight: 600 }}>{row.product_name}</div>
                                                                        <div style={{ fontSize: '0.8rem', color: THEME.subtext }}>SKU: {row.sku || 'N/A'}</div>
                                                                    </div>
                                                                ) : row.date}
                                                            </td>
                                                            <td style={{ textAlign: 'right', padding: '1rem' }}>{formatCurrency(row.revenue_gross)}</td>
                                                            {!isProductView && <td style={{ textAlign: 'right', padding: '1rem', color: THEME.subtext }}>{formatCurrency(row.spend)}</td>}
                                                            <td style={{ textAlign: 'right', padding: '1rem', color: row.profit_estimated > 0 ? THEME.success : THEME.danger, fontWeight: 700 }}>
                                                                {formatCurrency(row.profit_estimated)}
                                                            </td>
                                                            <td style={{ textAlign: 'right', padding: '1rem' }}>
                                                                <span style={{ padding: '4px 8px', borderRadius: '6px', background: row.margin_percent > 20 ? '#ecfdf5' : '#fef2f2', color: row.margin_percent > 20 ? THEME.success : THEME.danger, fontWeight: 600 }}>
                                                                    {row.margin_percent.toFixed(1)}%
                                                                </span>
                                                            </td>
                                                            {isProductView && (
                                                                <td style={{ textAlign: 'right', padding: '1rem', fontWeight: 600 }}>{row.units_sold}</td>
                                                            )}
                                                            {isProductView && (
                                                                <td style={{ textAlign: 'right', padding: '1rem' }}>
                                                                    <ProductStatusBadge status={row.status} />
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                    {data.series.length === 0 && (
                                                        <tr>
                                                            <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: THEME.subtext }}>
                                                                Aucune donnée trouvée pour cette période.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT SIDEBAR: INSIGHTS */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0055ff 100%)', borderRadius: '20px', padding: '1.5rem', color: '#fff', boxShadow: '0 8px 30px rgba(0, 122, 255, 0.25)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                            <AlertCircle size={20} color="#fff" />
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Coach IA</h3>
                                        </div>
                                        <p style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.6 }}>
                                            {data.context
                                                ? `Focus du jour : Votre produit "${data.context.heroProducts[0]?.name}" représente ${((data.context.heroProducts[0]?.revenue / (data.summary.total_revenue || 1)) * 100).toFixed(0)}% du CA global. Côté acquisition, ${data.context.topChannels[0]?.channel} mène la marche (ROAS ${data.context.topChannels[0]?.roas.toFixed(1)}).`
                                                : isProductView
                                                    ? "Votre 'Produit Hero' génère une part significative des profits. Surveillez le stock."
                                                    : "Votre marge nette est stable. Continuez à optimiser vos coûts d'acquisition."
                                            }
                                        </p>
                                    </div>
                                    <div style={{ background: THEME.card, borderRadius: '20px', padding: '1.5rem', border: `1px solid ${THEME.border}` }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: THEME.subtext }}>Répartition par Source</h3>
                                        {/* Placeholder for Donut Chart */}
                                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.subtext, fontSize: '0.9rem', background: '#f9f9f9', borderRadius: '12px' }}>
                                            Analyse en cours...
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </>
                    )}
                </div> {/* End content wrapper */}
            </div>
        </div>
    );
}

// --- SUBCOMPONENTS ---

function SummaryCard({ title, value, type, negate, highlight }: any) {
    const formatted = type === 'currency' ? formatCurrency(value) : value.toFixed(1) + '%';
    const color = highlight ? (value > 0 ? THEME.success : THEME.danger) : THEME.text;
    return (
        <div style={{ background: THEME.card, borderRadius: '20px', padding: '1.5rem', border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ color: THEME.subtext, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: color, letterSpacing: '-0.02em' }}>
                {negate && value > 0 ? '-' : ''}{formatted}
            </div>
        </div>
    );
}

function ProductHeroCard({ title, data, icon }: any) {
    if (!data) return null;
    return (
        <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)', borderRadius: '20px', padding: '1.5rem', color: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', opacity: 0.8 }}>
                    {icon}
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {data.product_name}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>CA: {formatCurrency(data.revenue_gross)}</div>
                    <div style={{ fontSize: '0.9rem', color: '#4ADE80', fontWeight: 600 }}>Profit: {formatCurrency(data.profit_estimated)}</div>
                </div>
            </div>
            {/* Background Decor */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        </div>
    );
}

function ProductStatusBadge({ status }: { status: string }) {
    let bg = '#eee';
    let color = '#666';
    if (status === 'Hero') { bg = '#FFF7ED'; color = '#F59E0B'; }
    if (status === 'Volume') { bg = '#EFF6FF'; color = '#3B82F6'; }
    if (status === 'Sleeper') { bg = '#F3F4F6'; color = '#9CA3AF'; }

    return (
        <span style={{ padding: '4px 10px', borderRadius: '20px', background: bg, color: color, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            {status}
        </span>
    );
}

function formatCurrency(val: number) {
    if (val === undefined || val === null) return '0 €';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
}
