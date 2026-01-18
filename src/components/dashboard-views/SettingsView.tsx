'use client';

import React, { useEffect, useState } from 'react';
import { Save, Check, Loader2, ChevronRight } from 'lucide-react';
import DangerZoneClient from '@/components/account/DangerZoneClient';
import LogsViewer from '@/components/account/LogsViewer';

interface SettingsData {
    currency: string;
    vatEnabled: boolean;
    vatMode: 'HT' | 'TTC';
    vatRate: number;
    shippingCostMode: 'NONE' | 'FIXED_PER_ORDER' | 'PERCENT_REVENUE';
    shippingCostValue: number;
    paymentFeePercent: number;
    paymentFeeFixed: number;
    syncEnabled: boolean;
    syncFrequency: 'DAILY' | 'HOURLY';
    syncPreferredHour: number;
    reportWeeklyEnabled: boolean;
    dataMode: 'STRICT' | 'ESTIMATE';
    estimateCogsFallback: number;
}

export default function SettingsView({ orgId, logs }: { orgId: string, logs?: any[] }) {
    const [settings, setSettings] = useState<SettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data && !data.error) setSettings(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        if (orgId) fetchSettings();
    }, [orgId]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Enregistré' });
                setTimeout(() => setMessage(null), 2000);
            } else {
                throw new Error("Erreur sauvegarde");
            }
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: 'Erreur' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof SettingsData, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-300" /></div>;
    if (!settings) return <div className="p-10 text-center text-red-500">Erreur de chargement des paramètres.</div>;

    return (
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-in fade-in pb-32 font-sans text-gray-900">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
                    <p className="text-sm text-gray-500 mt-1">Configuration générale de votre organisation.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${saving ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg'}`}
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : message ? <Check size={16} /> : 'Enregistrer'}
                    {message ? message.text : saving ? '...' : ''}
                </button>
            </div>

            {/* SECTIONS LIST STYLE */}
            <div className="space-y-10">

                {/* DATA */}
                <section>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Données & Fiabilité</h3>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-5 flex items-center justify-between border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                            <div>
                                <div className="font-semibold text-gray-900 text-sm">Mode de Calcul</div>
                                <div className="text-xs text-gray-500 mt-0.5">Comment traiter les données manquantes (COGS)</div>
                            </div>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => handleChange('dataMode', 'STRICT')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${settings.dataMode === 'STRICT' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                                >
                                    Strict
                                </button>
                                <button
                                    onClick={() => handleChange('dataMode', 'ESTIMATE')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${settings.dataMode === 'ESTIMATE' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                                >
                                    Estimation
                                </button>
                            </div>
                        </div>

                        {settings.dataMode === 'ESTIMATE' && (
                            <div className="p-5 flex items-center justify-between border-b border-gray-100 last:border-0 bg-indigo-50/10">
                                <div>
                                    <div className="font-semibold text-indigo-900 text-sm">Marge par défaut (COGS)</div>
                                    <div className="text-xs text-indigo-600/80 mt-0.5">Valeur utilisée si le coût produit est introuvable</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <SmartInput
                                        value={settings.estimateCogsFallback}
                                        onChange={v => handleChange('estimateCogsFallback', v)}
                                        className="w-16 text-right font-mono font-bold bg-transparent border-b border-indigo-200 focus:border-indigo-500 outline-none py-1 text-indigo-700"
                                    />
                                    <span className="text-xs font-bold text-indigo-400">%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* FISCAL */}
                <section>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Fiscalité & Coûts</h3>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
                        {/* TVA */}
                        <div className="p-5 flex items-center justify-between hover:bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <Toggle checked={settings.vatEnabled} onChange={v => handleChange('vatEnabled', v)} />
                                <div>
                                    <div className="font-semibold text-gray-900 text-sm">Gestion TVA</div>
                                    <div className="text-xs text-gray-500 mt-0.5">Déduire la TVA du CA Brut</div>
                                </div>
                            </div>
                            {settings.vatEnabled && (
                                <div className="flex items-center gap-4 animate-in slide-in-from-right-2">
                                    <select
                                        value={settings.vatMode}
                                        onChange={e => handleChange('vatMode', (e.target.value as any))}
                                        className="text-xs font-bold bg-gray-50 border border-gray-200 rounded py-1.5 px-2"
                                    >
                                        <option value="HT">Prix Hors Taxe</option>
                                        <option value="TTC">Prix TTC</option>
                                    </select>
                                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Taux</span>
                                        <SmartInput
                                            value={settings.vatRate}
                                            onChange={v => handleChange('vatRate', v)}
                                            className="w-10 text-right font-mono text-sm bg-transparent outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Fees */}
                        <div className="p-5 flex items-center justify-between hover:bg-gray-50/50">
                            <div>
                                <div className="font-semibold text-gray-900 text-sm">Frais de Paiement (Par Commande)</div>
                                <div className="text-xs text-gray-500 mt-0.5">Calculé par commande (Stripe, PayPal, etc.)</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold mb-1">Variable</span>
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                        <SmartInput
                                            value={settings.paymentFeePercent}
                                            onChange={v => handleChange('paymentFeePercent', v)}
                                            className="w-10 text-right font-mono text-sm bg-transparent outline-none"
                                        />
                                        <span className="text-xs text-gray-400">%</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-gray-100"></div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold mb-1">Fixe</span>
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                        <SmartInput
                                            value={settings.paymentFeeFixed}
                                            onChange={v => handleChange('paymentFeeFixed', v)}
                                            className="w-10 text-right font-mono text-sm bg-transparent outline-none"
                                        />
                                        <span className="text-xs text-gray-400">€</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="p-5 flex items-center justify-between hover:bg-gray-50/50">
                            <div>
                                <div className="font-semibold text-gray-900 text-sm">Frais de Livraison (Par Commande)</div>
                                <div className="text-xs text-gray-500 mt-0.5">Appliqué à chaque commande</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    className="text-xs font-bold bg-gray-50 border border-gray-200 rounded py-1.5 px-2"
                                    value={settings.shippingCostMode}
                                    onChange={e => handleChange('shippingCostMode', e.target.value)}
                                >
                                    <option value="NONE">Desactivé</option>
                                    <option value="FIXED_PER_ORDER">Fixe / Commande</option>
                                    <option value="PERCENT_REVENUE">% du CA</option>
                                </select>
                                {settings.shippingCostMode !== 'NONE' && (
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200 animate-in fade-in">
                                        <SmartInput
                                            value={settings.shippingCostValue}
                                            onChange={v => handleChange('shippingCostValue', v)}
                                            className="w-12 text-right font-mono text-sm bg-transparent outline-none"
                                        />
                                        <span className="text-xs text-gray-400 font-bold">
                                            {settings.shippingCostMode === 'PERCENT_REVENUE' ? '%' : '€'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SYNC */}
                <section>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Automation</h3>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-5 flex flex-col gap-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <Toggle checked={settings.syncEnabled} onChange={v => handleChange('syncEnabled', v)} />
                                    <div>
                                        <div className="font-semibold text-gray-900 text-sm">Synchronisation Auto</div>
                                        <div className="text-xs text-gray-500 mt-0.5">Mise à jour des connecteurs</div>
                                    </div>
                                </div>
                                {settings.syncEnabled && (
                                    <select
                                        className="text-xs font-bold bg-blue-50 text-blue-600 border-none rounded py-1.5 px-3 animate-in fade-in"
                                        value={settings.syncFrequency}
                                        onChange={e => handleChange('syncFrequency', e.target.value as any)}
                                    >
                                        <option value="DAILY">Quotidien (24h)</option>
                                        <option value="HOURLY">Toutes les heures</option>
                                    </select>
                                )}
                            </div>

                            {settings.syncEnabled && (
                                <div className="pl-[52px] animate-in slide-in-from-top-1">
                                    <p className="text-xs text-gray-400 italic flex items-center gap-1">
                                        <Check size={12} className="text-green-500" />
                                        La prochaine mise à jour se fera {settings.syncFrequency === 'HOURLY' ? 'dans moins d\'une heure' : 'cette nuit vers 03:00'}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* DIAGNOSTICS & LOGS (Moved from Account) */}
            <div className="mt-12 pt-12 border-t border-gray-100">
                <h3 className="text-xl font-bold mb-6">Zone Technique</h3>
                <DangerZoneClient />
                <LogsViewer logs={logs || []} />
            </div>
        </div >
    );
}

// --- COMPONENTS ---

function Toggle({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`w-9 h-5 rounded-full transition-all duration-300 relative ${checked ? 'bg-black' : 'bg-gray-200'}`}
        >
            <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-4' : ''}`} />
        </button>
    )
}

interface SmartInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: number | string;
    onChange: (value: number) => void;
}

function SmartInput({ value, onChange, className, ...props }: SmartInputProps) {
    const [localValue, setLocalValue] = useState(value?.toString() || '');

    useEffect(() => {
        setLocalValue(value?.toString() || '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        setLocalValue(val);
        const normalized = val.replace(',', '.');
        const num = parseFloat(normalized);
        // Only trigger change if valid number
        if (!isNaN(num)) onChange(num);
    };

    return (
        <input
            {...props}
            type="text"
            value={localValue}
            onChange={handleChange}
            className={className}
        />
    )
}
