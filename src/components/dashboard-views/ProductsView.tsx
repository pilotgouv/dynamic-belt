'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package, Trophy, AlertTriangle, ArrowRight, XCircle, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductsViewProps {
    orgId: string;
}

export default function ProductsView({ orgId }: ProductsViewProps) {
    const { range } = useDateRange();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            setLoading(true);
            try {
                // Parallel Fetch: Data + Settings
                const query = new URLSearchParams({
                    start: range.start.toISOString(),
                    end: range.end.toISOString()
                });

                const [resData, resSettings] = await Promise.all([
                    fetch(`/api/products?${query}`, { cache: 'no-store' }),
                    fetch(`/api/settings`)
                ]);

                const resultData = await resData.json();
                const resultSettings = await resSettings.json();

                if (isMounted) {
                    setData(resultData);
                    setSettings(resultSettings);
                }
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

    // --- STATUS LOGIC ---
    const getProductStatus = (p: any): 'READY' | 'IMPORTING' | 'INVALID' => {
        if (!p.id) return 'INVALID';
        return 'READY';
    };

    const handleCogsUpdate = async (productId: string, newCost: number, details?: any[]) => {
        try {
            const res = await fetch(`/api/products/cost/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ costUnit: newCost, costDetails: details })
            });

            if (!res.ok) {
                const err = await res.json();
                if (res.status === 409) throw new Error("Produit en cours d'import, veuillez patienter.");
                if (res.status === 404) throw new Error("Produit non trouvé. Essayez de re-synchroniser.");
                throw new Error(err.error || "Erreur inconnue");
            }

            // Silent Refresh
            const query = new URLSearchParams({ start: range.start.toISOString(), end: range.end.toISOString() });
            const refreshRes = await fetch(`/api/products?${query}`, { cache: 'no-store' });
            const refreshResult = await refreshRes.json();
            setData(refreshResult);
            return true; // Success

        } catch (e: any) {
            console.error(e);
            alert(`Échec : ${e.message}`);
            return false;
        }
    };

    if (!loading && data) {
        const hasCatalog = data.products.length > 0;
        if (!hasCatalog && data.summary?.catalogCount === 0) {
            return <EmptyConnectState />;
        }
    }

    const summary = data?.summary || {};
    const products = data?.products || [];
    const isStrict = settings?.dataMode === 'STRICT';
    const missingCogsCount = products.filter((p: any) => !p.costUnit || p.costUnit === 0).length;

    // HERO CALCULATION (>19% Share OR Top 1)
    const totalRevenue = products.reduce((sum: number, p: any) => sum + p.revenue, 0);
    let heroes = products
        .filter((p: any) => totalRevenue > 0 && (p.revenue / totalRevenue) > 0.19)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 3);

    // Fallback if no hero found but revenue exists
    if (heroes.length === 0 && products.length > 0 && totalRevenue > 0) {
        const sorted = [...products].sort((a: any, b: any) => b.revenue - a.revenue);
        if (sorted[0].revenue > 0) heroes = [sorted[0]];
    }
    const heroIds = heroes.map((p: any) => p.id);

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">

            {/* Contextual Warning for Missing Data */}
            {missingCogsCount > 0 && (
                <div className={`rounded-lg border px-4 py-3 flex items-center justify-between shadow-sm ${isStrict ? 'bg-red-50 border-red-100 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} />
                        <div>
                            <span className="font-bold flex items-center gap-2">
                                {missingCogsCount} produit(s) sans coût défini.
                                {isStrict && <span className="bg-red-200 text-red-900 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Mode Strict</span>}
                            </span>
                            <p className="text-xs opacity-90 mt-0.5">
                                {isStrict
                                    ? "Leur profit est ignoré (marqué comme incomplet) pour garantir l'exactitude."
                                    : `Une marge estimée par défaut (${settings?.estimateCogsFallback || 40}%) est appliquée.`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ROW A: KPIs V2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Total SKUs Sold" value={summary.totalSkus} loading={loading} />
                <KPICard title="Hero Products" value={heroes.length} loading={loading} description="Produits > 19% du CA" />
                <KPICard title="Top SKU Profit Share" value={summary.topSkuProfitShare ? summary.topSkuProfitShare.toFixed(1) : '-'} suffix="%" loading={loading} />
                <KPICard title="Marge Moyenne" value={summary.avgMargin ? summary.avgMargin.toFixed(1) : '-'} suffix="%" loading={loading} />
            </div>

            {/* ROW B: PRODUCTS TABLE */}
            <div id="products-table" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Package size={18} className="text-gray-400" /> Performance Produit
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                        <span className="text-xs font-medium text-gray-600">Sync: OK</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Produit</th>
                                <th className="px-6 py-4">Coût (COGS)</th>
                                <th className="px-6 py-4 text-right">Unités</th>
                                <th className="px-6 py-4 text-right">CA</th>
                                <th className="px-6 py-4 text-right">Profit</th>
                                <th className="px-6 py-4 text-right">Marge %</th>
                                <th className="px-6 py-4 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.map((p: any, i: number) => {
                                const status = getProductStatus(p);
                                const hasCost = p.costUnit && p.costUnit > 0;
                                const isHero = heroIds.includes(p.id);

                                // Display Logic for Profit/Margin
                                let profitDisplay = formatCurrency(p.profit);
                                let marginDisplay = `${p.margin.toFixed(1)}%`;
                                let isEstimatedRow = false;
                                let isIncompleteRow = false;

                                if (!hasCost) {
                                    if (isStrict) {
                                        profitDisplay = "---";
                                        marginDisplay = "N/A";
                                        isIncompleteRow = true;
                                    } else {
                                        isEstimatedRow = true;
                                    }
                                }

                                return (
                                    <tr key={i} className={`hover:bg-blue-50/30 transition-colors group ${isIncompleteRow ? 'bg-red-50/10' : ''} ${isHero ? 'bg-yellow-50/50' : ''}`}>
                                        <td className="px-6 py-4 max-w-[400px]">
                                            <div className="flex items-center gap-6">
                                                <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm ${isHero ? 'p-[2px] bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600' : 'bg-gray-100 border border-gray-200'}`}>
                                                    <div className="w-full h-full rounded-[14px] overflow-hidden bg-white relative">
                                                        {p.imageUrl ?
                                                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> :
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-50"><Package size={24} className="text-gray-300" /></div>
                                                        }
                                                        {isHero && (
                                                            <div className="absolute top-0 right-0 bg-black/80 backdrop-blur-md text-yellow-400 p-1.5 rounded-bl-xl shadow-sm z-10">
                                                                <Trophy size={10} fill="currentColor" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-gray-900 text-base truncate" title={p.name}>{p.name}</div>
                                                        {isHero && (
                                                            <span className="bg-gradient-to-r from-gray-900 to-gray-700 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wide">
                                                                HERO
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="font-mono text-gray-400 text-xs mt-1">{p.sku}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* COGS Editable Cell with Modal */}
                                        <td className="px-6 py-4">
                                            <CogsEditModal
                                                product={p}
                                                status={status}
                                                onSave={(val, details) => handleCogsUpdate(p.id, val, details)}
                                            />
                                        </td>

                                        <td className="px-6 py-4 text-right font-mono text-gray-600 font-bold">{p.units}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(p.revenue)}</td>

                                        <td className={`px-6 py-4 text-right font-bold ${hasCost ? (p.profit > 0 ? 'text-green-600' : 'text-red-600') : (isStrict ? 'text-gray-300' : 'text-amber-600')}`}>
                                            {profitDisplay}
                                            {isEstimatedRow && <sup className="text-[9px] ml-1 opacity-70">(est)</sup>}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            {isIncompleteRow ? (
                                                <span className="text-xs text-red-300 font-mono">Incomplet</span>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className={`text-xs font-bold ${p.margin >= 20 ? 'text-gray-700' : 'text-red-500'}`}>
                                                        {marginDisplay}
                                                    </span>
                                                    <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${p.margin >= 20 ? 'bg-green-500' : (isEstimatedRow ? 'bg-amber-400' : 'bg-red-500')}`} style={{ width: `${Math.min(100, Math.max(0, p.margin))}%` }}></div>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => router.push(`/dashboard/products/${p.sku}`)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600">
                                                <ArrowRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function EmptyConnectState() { return <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500"><EmptyState title="Aucun produit" message="Connectez une source." icon={<Package size={32} />} actionLabel="Connecter" actionUrl="/dashboard/connections" /></div> }

// --- MODAL COMPONENT ---
function CogsEditModal({ product, status, onSave }: { product: any, status: 'READY' | 'IMPORTING' | 'INVALID', onSave: (val: number, details?: any[]) => Promise<boolean> }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Detailed State
    const [rows, setRows] = useState<{ label: string, value: string }[]>([]);

    // Init state from product
    useEffect(() => {
        if (isOpen) {
            if (product.costDetails && Array.isArray(product.costDetails) && product.costDetails.length > 0) {
                setRows(product.costDetails.map((d: any) => ({ label: d.label, value: d.value.toString() })));
            } else if (product.costUnit) {
                // Pre-fill with single row if unit exists but no details
                setRows([{ label: 'Coût Production', value: product.costUnit.toString() }]);
            } else {
                setRows([{ label: 'Coût Production', value: '' }]);
            }
        }
    }, [isOpen, product]);

    const calculateTotal = () => {
        return rows.reduce((acc, row) => {
            const val = parseFloat(row.value.replace(',', '.'));
            return acc + (isNaN(val) ? 0 : val);
        }, 0);
    };

    const handleSave = async () => {
        const total = calculateTotal();
        if (total < 0) return alert("Valeur invalide");

        // Clean rows
        const cleanedDetails = rows.map(r => ({
            label: r.label.trim() || 'Coût',
            value: parseFloat(r.value.replace(',', '.')) || 0
        })).filter(r => r.value > 0);

        setLoading(true);
        const success = await onSave(total, cleanedDetails);
        setLoading(false);
        if (success) setIsOpen(false);
    };

    const addRow = () => setRows([...rows, { label: '', value: '' }]);
    const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));
    const updateRow = (idx: number, field: 'label' | 'value', val: string) => {
        const newRows = [...rows];
        newRows[idx] = { ...newRows[idx], [field]: val };
        setRows(newRows);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => status === 'READY' ? setIsOpen(true) : alert("Produit non éditable")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all text-sm font-medium
                    ${product.costUnit ? 'bg-white border-gray-200 text-gray-700 hover:border-blue-300' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}
                    ${status !== 'READY' ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {product.costUnit ? `${Number(product.costUnit).toFixed(2)} €` : 'Définir Coût'}
                <span className="text-xs opacity-50">✎</span>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px] max-w-full space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-900">Définir le Coût (COGS)</h3>
                        <p className="text-xs text-gray-500 mt-1">{product.name}</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={20} /></button>
                </div>

                <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
                    {rows.map((row, idx) => (
                        <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                            <input
                                className="flex-1 border border-gray-200 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                placeholder="Nom (ex: Packaging)"
                                value={row.label}
                                onChange={e => updateRow(idx, 'label', e.target.value)}
                            />
                            <input
                                className="w-24 border border-gray-200 rounded p-2 text-sm text-right focus:border-blue-500 outline-none"
                                placeholder="0.00"
                                value={row.value}
                                onChange={e => updateRow(idx, 'value', e.target.value)}
                            />
                            <button onClick={() => removeRow(idx)} className="text-gray-300 hover:text-red-500 p-1">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button onClick={addRow} className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors w-full justify-center border border-dashed border-blue-200">
                        <Plus size={14} /> Ajouter un coût
                    </button>
                </div>

                <div className="pt-2 border-t border-gray-50 flex justify-between items-end">
                    <div className="text-xs text-gray-500">Coût Total Unitaire</div>
                    <div className="text-xl font-bold text-gray-900">{calculateTotal().toFixed(2)} €</div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Annuler</button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {loading && <span className="animate-spin h-3 w-3 border-2 border-white/50 border-t-white rounded-full"></span>}
                        {loading ? 'Calcul...' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    )
}
