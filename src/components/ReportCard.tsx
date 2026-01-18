'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, Clock, Trash2, Edit, FileText, Play } from 'lucide-react';

interface ReportCardProps {
    report: any;
}

export default function ReportCard({ report }: ReportCardProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    const lastRun = report.runs && report.runs[0];

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce rapport ?")) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/reports/${report.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.refresh();
            } else {
                console.error("Delete failed", res);
                alert("Impossible de supprimer le rapport. Vérifiez vos permissions.");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression.");
        } finally {
            setDeleting(false);
        }
    };

    if (deleting) return (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 flex items-center justify-center h-[200px] animate-pulse">
            <span className="text-gray-400 text-sm font-medium">Suppression...</span>
        </div>
    );

    return (
        <div className="group bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${report.isPreset ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                    {report.isPreset ? <BarChart3 size={20} /> : <FileText size={20} />}
                </div>

                <div className="flex items-center gap-2">
                    {report.isPreset && (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md">Système</span>
                    )}
                    {/* Delete Action (Top Right Cross) */}
                    {!report.isPreset && (
                        <button
                            onClick={handleDelete}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Supprimer le rapport"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{report.name}</h3>
            <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-2 leading-relaxed">
                {report.description || "Aucune description fournie."}
            </p>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-50 flex flex-col gap-4 mt-auto">
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{lastRun ? new Date(lastRun.runAt).toLocaleDateString() : 'Jamais'}</span>
                    </div>
                    {lastRun && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${lastRun.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {lastRun.status === 'success' ? 'Succès' : 'Échec'}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href={`/dashboard/reports/run/${report.id}`}
                        className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                    >
                        <Play size={14} /> Voir
                    </Link>
                    {/* Edit link points to New with cloneId because we don't have Edit Page yet */}
                    {!report.isPreset ? (
                        <Link
                            href={`/dashboard/reports/new?cloneId=${report.id}`}
                            className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg text-xs font-bold transition-colors"
                        >
                            <Edit size={14} /> Éditer
                        </Link>
                    ) : (
                        <button disabled className="flex items-center justify-center gap-2 py-2.5 border border-gray-100 text-gray-300 rounded-lg text-xs font-bold cursor-not-allowed">
                            <Edit size={14} /> Éditer
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
