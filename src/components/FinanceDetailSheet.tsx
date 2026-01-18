
import React, { useEffect, useState } from 'react';
import { X, Loader2, Download, ExternalLink } from 'lucide-react';

interface FinanceDetailSheetProps {
    visible: boolean;
    onClose: () => void;
    type: 'shipping_fees' | 'ads' | 'cogs' | 'profit' | null;
    range: { start: Date, end: Date };
    orgId: string;
}

export default function FinanceDetailSheet({ visible, onClose, type, range, orgId }: FinanceDetailSheetProps) {
    const [data, setData] = useState<{ items: any[], headers: any[], title: string } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && type && orgId) {
            fetchData();
        } else {
            setData(null);
        }
    }, [visible, type, orgId, range]);

    async function fetchData() {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: orgId,
                    type,
                    rangeStart: range.start,
                    rangeEnd: range.end
                })
            });
            const json = await res.json();
            if (res.ok) setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (!visible) return null;

    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
    const formatDate = (val: string) => new Date(val).toLocaleDateString('fr-FR');

    return (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="bg-white w-full max-w-2xl h-full shadow-2xl pointer-events-auto flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto relative z-10 border-l border-gray-100">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{data?.title || 'Chargement...'}</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {range.start.toLocaleDateString()} - {range.end.toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
                            <Loader2 className="animate-spin" /> Chargement...
                        </div>
                    ) : (data && (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 sticky top-0">
                                <tr>
                                    {data.headers.map((h: any) => (
                                        <th key={h.key} className="px-6 py-3 font-semibold">{h.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.items.length === 0 && (
                                    <tr>
                                        <td colSpan={data.headers.length} className="px-6 py-8 text-center text-gray-400">Aucune donnée trouvée</td>
                                    </tr>
                                )}
                                {data.items.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        {data.headers.map((h: any) => {
                                            const val = row[h.key];
                                            let display = val;

                                            // Formatting
                                            if (typeof val === 'number' && (h.key.toLowerCase().includes('cost') || h.key.toLowerCase().includes('revenue') || h.key.toLowerCase().includes('spend') || h.key.toLowerCase().includes('unit') || h.key.toLowerCase().includes('val') || h.key.toLowerCase().includes('shipping') || h.key === 'fees')) {
                                                display = formatCurrency(val);
                                            }
                                            if (h.key === 'date') display = formatDate(val);

                                            // Styling for Status
                                            if (h.key === 'status') {
                                                const color = val === 'EXACT' ? 'bg-green-100 text-green-700' : val === 'ESTIMÉ' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
                                                display = <span className={`px-2 py-0.5 rounded textxs font-bold ${color}`}>{val}</span>;
                                            }

                                            return (
                                                <td key={h.key} className="px-6 py-3 whitespace-nowrap text-gray-700">
                                                    {display}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ))}
                </div>
            </div>
        </div>
    );
}
