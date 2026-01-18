import React, { useState, useEffect } from 'react';
import { X, Search, ExternalLink, CheckCircle, AlertCircle, Copy, ChevronRight, HelpCircle } from 'lucide-react';
import { CONNECTION_GUIDES } from '@/lib/connectionGuides';
import { BrandIcon } from '@/components/common/BrandIcon';

interface ConnectionGuideSheetProps {
    visible: boolean;
    onClose: () => void;
    initialProvider?: string | null;
    onSelectProvider?: (provider: string) => void;
}

export default function ConnectionGuideSheet({ visible, onClose, initialProvider, onSelectProvider }: ConnectionGuideSheetProps) {
    const [search, setSearch] = useState('');
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    // Sync initial provider
    useEffect(() => {
        if (visible && initialProvider) {
            setSelectedKey(initialProvider);
        } else if (visible && !initialProvider) {
            setSelectedKey(null); // Reset to list if opened globally
        }
    }, [visible, initialProvider]);

    if (!visible) return null;

    const filteredKeys = Object.keys(CONNECTION_GUIDES).filter(key =>
        CONNECTION_GUIDES[key].title.toLowerCase().includes(search.toLowerCase()) ||
        CONNECTION_GUIDES[key].category.toLowerCase().includes(search.toLowerCase())
    );

    const activeGuide = selectedKey ? CONNECTION_GUIDES[selectedKey] : null;

    const copyChecklist = () => {
        if (!activeGuide) return;
        const text = `Checklist ${activeGuide.title}:\n\n` + activeGuide.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n');
        navigator.clipboard.writeText(text);
        alert('Checklist copiée !');
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end', pointerEvents: 'none' }}>
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', pointerEvents: 'auto', backdropFilter: 'blur(2px)', transition: 'opacity 0.3s' }}
                onClick={onClose}
            />

            {/* Sheet Content */}
            <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col pointer-events-auto transform transition-transform duration-300 ease-out translate-x-0 font-sans border-l border-slate-100">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <HelpCircle size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Guide de Connexion</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0">
                    {/* View: List */}
                    {!activeGuide && (
                        <div className="p-6 space-y-6">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                    placeholder="Rechercher integration (e.g. Shopify)..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Integrations Disponibles</h3>
                                {filteredKeys.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Aucune intégration trouvée.</p>}
                                {filteredKeys.map(key => {
                                    const g = CONNECTION_GUIDES[key];
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedKey(key)}
                                            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group text-left"
                                        >
                                            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                                <BrandIcon provider={key} size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-800">{g.title}</div>
                                                <div className="text-xs text-slate-500">{g.category}</div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* View: Detail */}
                    {activeGuide && (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-200">
                            {/* Breadcrumb */}
                            <div className="px-6 py-3 border-b border-slate-50 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 cursor-pointer transition-colors" onClick={() => setSelectedKey(null)}>
                                <ChevronRight size={14} className="rotate-180" />
                                <span>Retour à la liste</span>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Title Header */}
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                                        <BrandIcon provider={selectedKey!} size={32} />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-slate-900">{activeGuide.title}</h1>
                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{activeGuide.role}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                ⏱️ {activeGuide.time}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                {activeGuide.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Prerequisites */}
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                                        <AlertCircle size={14} /> Pré-requis
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-amber-900 space-y-1 ml-1">
                                        {activeGuide.prerequisites.map((p: string, i: number) => (
                                            <li key={i}>{p}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Steps */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-900">Installation Pas-à-Pas</h3>
                                        <button onClick={copyChecklist} className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                            <Copy size={12} /> Copier
                                        </button>
                                    </div>

                                    <div className="space-y-8 relative pl-6 border-l-2 border-slate-100 ml-2 py-2">
                                        {activeGuide.steps.map((step: string, i: number) => (
                                            <div key={i} className="relative">
                                                <div className="absolute -left-[27px] top-0 w-7 h-7 rounded-full bg-white border-2 border-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shadow-sm">
                                                    {i + 1}
                                                </div>
                                                <div className="text-sm text-slate-700 leading-relaxed pt-1 pl-1">
                                                    {step}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">À renseigner dans PILOT</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {activeGuide.fields.map((f: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 shadow-sm">
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Links */}
                                {activeGuide.links && activeGuide.links.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Liens Utiles</h4>
                                        <div className="space-y-2">
                                            {activeGuide.links.map((link: any, i: number) => (
                                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
                                                    <ExternalLink size={14} /> {link.label}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Troubleshooting */}
                                {activeGuide.troubleshooting && (
                                    <div className="border-t border-slate-100 pt-6">
                                        <h4 className="text-sm font-bold text-slate-900 mb-3">Dépannage</h4>
                                        <ul className="space-y-2">
                                            {activeGuide.troubleshooting.map((t: string, i: number) => (
                                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                                    {t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer */}
                            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0">
                                <button
                                    onClick={() => {
                                        if (onSelectProvider && selectedKey) {
                                            onSelectProvider(selectedKey);
                                        }
                                        onClose();
                                    }}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                                >
                                    Configurer {activeGuide.title}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
