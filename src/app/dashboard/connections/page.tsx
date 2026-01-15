
"use client";

import React, { useState, useEffect } from 'react';
import styles from './connections.module.css';
import {
    CheckCircle, AlertCircle, RefreshCw, Loader2, Plus, Trash2, Key
} from 'lucide-react';
import { useSession } from 'next-auth/react';

// Provider Setup
const PROVIDERS = {
    SHOPIFY: { label: 'Shopify', icon: '🛍️', fields: ['shopDomain', 'accessToken'] },
    WOOCOMMERCE: { label: 'WooCommerce', icon: '🛒', fields: ['storeUrl', 'consumerKey', 'consumerSecret'] },
    AMAZON_SELLER: {
        label: 'Amazon Seller',
        icon: '📦',
        fields: ['region', 'marketplaceIds', 'lwaClientId', 'lwaClientSecret', 'lwaRefreshToken', 'awsAccessKeyId', 'awsSecretAccessKey'],
        placeholders: { marketplaceIds: 'Comma separated (e.g. A1PA..., A1R...)' }
    },
    AMAZON_ADS: {
        label: 'Amazon Ads',
        icon: '📣',
        fields: ['region', 'profileId', 'lwaClientId', 'lwaClientSecret', 'lwaRefreshToken'],
    },
    GOOGLE_ADS: { label: 'Google Ads', icon: '📈', fields: ['customerId', 'accessToken', 'refreshToken', 'developerToken'] },
    META_ADS: { label: 'Meta Ads', icon: '📘', fields: ['adAccountId', 'accessToken'] },
    TIKTOK_ADS: { label: 'TikTok Ads', icon: '🎵', fields: ['advertiserId', 'accessToken'] },
    GA4: { label: 'Google Analytics 4', icon: '📊', fields: ['propertyId', 'clientEmail', 'privateKey'] }
};

export default function ConnectionsPage() {
    const { data: session } = useSession();
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [limitReached, setLimitReached] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Sync All Handler
    const handleSyncAll = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/sync', { method: 'POST', body: JSON.stringify({}) });
            const data = await res.json();
            if (data.results) {
                const successCount = data.results.filter((r: any) => r.success).length;
                alert(`Sync terminé: ${successCount} succès / ${data.results.length} total.`);
                fetchConnections();
            } else if (data.result) {
                alert(data.result.success ? "Sync terminé avec succès." : "Erreur Sync.");
                fetchConnections();
            }
        } catch (e) {
            alert("Erreur Sync");
        } finally {
            setSyncing(false);
        }
    };

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    // Fetch Connections
    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/connections');
            if (res.ok) {
                const data = await res.json();
                setConnections(data);

                // Check limit locally for UI feedback (Server enforces too)
                const plan = (session?.user as any)?.plan || 'free';
                const activeCount = data.filter((c: any) => c.status === 'ACTIVE').length;
                if (plan === 'free' && activeCount >= 1) setLimitReached(true);
                else setLimitReached(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) fetchConnections();
    }, [session]);

    // Handle Delete
    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette connexion ?")) return;
        await fetch(`/api/connections/${id}`, { method: 'DELETE' });
        fetchConnections();
    };

    // Pre-process Data
    const prepareData = () => {
        const data = { ...formData };
        if (selectedProvider === 'AMAZON_SELLER' && data.marketplaceIds && typeof data.marketplaceIds === 'string') {
            data.marketplaceIds = data.marketplaceIds.split(',').map((s: string) => s.trim());
        }
        return data;
    }

    // Handle Test
    const handleTest = async () => {
        setSaving(true);
        setTestResult(null);
        try {
            const payload = prepareData();
            const res = await fetch('/api/connections/test', {
                method: 'POST',
                body: JSON.stringify({ provider: selectedProvider, credentials: payload })
            });
            const data = await res.json();
            setTestResult(data);
            setSaving(false);
            return data.success;
        } catch (e) {
            setTestResult({ success: false, error: "Erreur test" });
            setSaving(false);
            return false;
        }
    };

    // Handle Save
    const handleSave = async () => {
        const success = await handleTest();
        if (!success) return;

        setSaving(true);
        try {
            const payload = prepareData();
            const res = await fetch('/api/connections', {
                method: 'POST',
                body: JSON.stringify({
                    provider: selectedProvider,
                    name: `${PROVIDERS[selectedProvider as keyof typeof PROVIDERS].label} Store`,
                    credentials: payload
                })
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Erreur sauvegarde');
            }

            setShowModal(false);
            setFormData({});
            setTestResult(null);
            fetchConnections();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    // Render Form Fields
    const renderFields = () => {
        if (!selectedProvider) return null;
        const fields = PROVIDERS[selectedProvider as keyof typeof PROVIDERS].fields;
        return (
            <div style={{ display: 'grid', gap: '1rem' }}>
                {fields.map(field => (
                    <div key={field}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                            {field.toUpperCase()}
                        </label>
                        <input
                            className="input-premium"
                            type={field.toLowerCase().includes('token') || field.includes('Secret') || field.includes('Key') ? 'password' : 'text'}
                            value={formData[field] || ''}
                            onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                            style={{
                                width: '100%', padding: '0.6rem', borderRadius: '6px',
                                border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Integrations</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Connectez vos sources de données pour alimenter PILOT.</p>
                </div>
                {connections.length > 0 && (
                    <button
                        onClick={handleSyncAll}
                        disabled={syncing}
                        style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                            padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
                        }}
                    >
                        <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                        {syncing ? 'Synchronisation...' : 'Synchroniser Tout'}
                    </button>
                )}
            </div>

            {/* Paywall Banner */}
            {limitReached && (
                <div style={{
                    background: 'rgba(180, 146, 53, 0.1)', border: '1px solid var(--accent-gold)',
                    borderRadius: '8px', padding: '1rem', marginBottom: '2rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>Plan Gratuit : Limite atteinte (1 connexion active).</div>
                    <a href="/pricing" style={{ background: 'var(--accent-gold)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600 }}>Passer Premium</a>
                </div>
            )}

            {/* Active Connections List */}
            {connections.length > 0 && (
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem' }}>
                    {connections.map(c => (
                        <div key={c.id} className="glass" style={{
                            padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '2rem' }}>{PROVIDERS[c.provider as keyof typeof PROVIDERS]?.icon || '🔗'}</div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: c.status === 'ACTIVE' ? 'var(--accent-teal)' : 'var(--text-muted)'
                                        }} />
                                        {c.status}
                                        {c.lastSyncAt && <span>• Sync: {new Date(c.lastSyncAt).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(c.id)}
                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Grid */}
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Ajouter une connexion</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {Object.entries(PROVIDERS).map(([key, info]) => {
                    // Special handling for Coming Soon
                    const isComingSoon = key === 'AMAZON_ADS'; // or store in info

                    return (
                        <button
                            key={key}
                            disabled={limitReached || isComingSoon}
                            onClick={() => {
                                if (!isComingSoon) {
                                    setSelectedProvider(key);
                                    setShowModal(true);
                                    setFormData({});
                                    setTestResult(null);
                                }
                            }}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                                padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)',
                                background: (limitReached || isComingSoon) ? 'var(--bg-hover)' : 'var(--bg-card)',
                                opacity: (limitReached || isComingSoon) ? 0.6 : 1,
                                cursor: (limitReached || isComingSoon) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                        >
                            <div style={{ fontSize: '2.5rem' }}>{info.icon}</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{info.label}</div>
                            {isComingSoon && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.7rem', background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>Bientôt</div>}
                        </button>
                    )
                })}
            </div>

            {/* Connection Modal */}
            {showModal && selectedProvider && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', width: '500px', maxWidth: '90%',
                        borderRadius: '16px', padding: '2rem', boxShadow: 'var(--shadow-lg)'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {PROVIDERS[selectedProvider as keyof typeof PROVIDERS].icon} Configurer {PROVIDERS[selectedProvider as keyof typeof PROVIDERS].label}
                        </h2>

                        {renderFields()}

                        {testResult && (
                            <div style={{
                                marginTop: '1rem', padding: '0.8rem', borderRadius: '6px',
                                background: testResult.success ? '#dcfce7' : '#fee2e2',
                                color: testResult.success ? '#166534' : '#991b1b',
                                fontSize: '0.9rem'
                            }}>
                                {testResult.success ? '✅ ' + testResult.message : '❌ ' + testResult.error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'transparent', border: '1px solid var(--border-subtle)', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    background: 'var(--primary-gradient)', color: '#fff', border: 'none',
                                    padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                {saving ? 'Test & Sauvegarde...' : 'Tester & Sauvegarder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
