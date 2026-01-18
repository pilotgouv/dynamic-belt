
"use client";

import React, { useState, useEffect } from 'react';
import styles from './connections.module.css';
import {
    CheckCircle, AlertCircle, RefreshCw, Loader2, Plus, Trash2, Key, HelpCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { BrandIcon } from '@/components/common/BrandIcon';
import ConnectionGuideSheet from '@/components/ConnectionGuideSheet';

// Provider Setup
const PROVIDERS = {
    SHOPIFY: {
        label: 'Shopify',
        icon: '🛍️',
        fields: [
            { key: 'shopDomain', label: 'Shop Domain', placeholder: 'votre-boutique.myshopify.com', example: 'yamm-geneve.myshopify.com' },
            { key: 'accessToken', label: 'Admin API Access Token', placeholder: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', example: 'shpat_1234567890abcdef...' }
        ]
    },
    WOOCOMMERCE: {
        label: 'WooCommerce',
        icon: '🛒',
        fields: [
            { key: 'storeUrl', label: 'Store URL', placeholder: 'https://votredomaine.com', example: 'https://maisonyamm.com' },
            { key: 'consumerKey', label: 'Consumer Key', placeholder: 'ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', example: 'ck_7f3c8a1b...' },
            { key: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', example: 'cs_1a2b3c4d...' }
        ]
    },
    AMAZON_SELLER: {
        label: 'Amazon Seller',
        icon: '📦',
        fields: [
            { key: 'region', label: 'Region', placeholder: 'eu-west-1', example: 'eu-west-1 (Europe) ou us-east-1' },
            { key: 'marketplaceIds', label: 'Seller / Merchant ID', placeholder: 'A1ABCDEF2GHIJK', example: 'A1P2Q3R4S5T6U7' },
            { key: 'lwaClientId', label: 'LWA Client ID', placeholder: 'amzn1.application-oa2-client.xx...', example: 'amzn1.application-oa2-client.7a1b...' },
            { key: 'lwaClientSecret', label: 'LWA Client Secret', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', example: 'aBcdEFghIJklMNopQRstUVwxYZ012345' },
            { key: 'lwaRefreshToken', label: 'Refresh Token', placeholder: 'Atzr|IwEBIxxxxxxxxxxxxxxxxxxxxxxxxxxxx', example: 'Atzr|IwEBILeKx...' },
            { key: 'awsAccessKeyId', label: 'AWS Access Key ID (option)', placeholder: 'AKIAxxxxxxxxxxxxxxx', example: 'AKIAIOSFODNN7EXAMPLE' },
            { key: 'awsSecretAccessKey', label: 'AWS Secret Access Key (option)', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', example: 'wJalrXUtnKEY...' }
        ]
    },
    AMAZON_ADS: {
        label: 'Amazon Ads',
        icon: '📣',
        fields: [
            { key: 'region', label: 'Region', placeholder: 'eu-west-1', example: 'eu-west-1' },
            { key: 'profileId', label: 'Profile ID', placeholder: '123456789012345', example: '2938475' },
            { key: 'lwaClientId', label: 'LWA Client ID', placeholder: 'amzn1.application...', example: '' },
            { key: 'lwaClientSecret', label: 'LWA Client Secret', placeholder: 'xxxx', example: '' },
            { key: 'lwaRefreshToken', label: 'Refresh Token', placeholder: 'Atzr|...', example: '' }
        ]
    },
    GOOGLE_ADS: {
        label: 'Google Ads',
        icon: '📈',
        fields: [
            { key: 'developerToken', label: 'Developer Token', placeholder: 'AbCdEfGhIjKlMnOpQrStUv', example: 'Votre Developer Token (API Center Google Ads)' },
            { key: 'clientId', label: 'OAuth Client ID', placeholder: '1234567890-abc...apps.googleusercontent.com', example: 'xxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com' },
            { key: 'clientSecret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-xxxxxxxxxxxxxxxxxxxx', example: 'GOCSPX-xxxxxxxxxxxxxxxx' },
            { key: 'refreshToken', label: 'OAuth Refresh Token', placeholder: '1//0gxxxxxxxxxxxxxxxxxxxxxxxx', example: '1//0gxxxxxxxxxxxxxxxx' },
            { key: 'loginCustomerId', label: 'Login Customer ID (MCC) - Optionnel', placeholder: '123-456-7890', example: '123-456-7890 (MCC ID)' },
            { key: 'customerId', label: 'Customer ID (Compte Pub)', placeholder: '987-654-3210', example: '987-654-3210 (Target Account ID)' }
        ]
    },
    META_ADS: {
        label: 'Meta Ads',
        icon: '📘',
        fields: [
            { key: 'adAccountId', label: 'Ad Account ID', placeholder: 'act_123456789012345', example: 'act_987654321098765' },
            { key: 'accessToken', label: 'Access Token', placeholder: 'EAABxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...', example: 'EAABsbCS1iHgBAKZC...' }
        ]
    },
    TIKTOK_ADS: {
        label: 'TikTok Ads',
        icon: '🎵',
        fields: [
            { key: 'appId', label: 'App ID', placeholder: '1234567890123456789', example: '1234567890123456789' },
            { key: 'appSecret', label: 'App Secret', placeholder: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4', example: 'xxxxxxxxxxxxxxxxxxxxxxxx' },
            { key: 'accessToken', label: 'Access Token', placeholder: 'act.xxxxxxxxxxxxxxxxxxxxxxxxx', example: 'act.xxxxxxxxxxxxxxxxx' },
            { key: 'advertiserId', label: 'Advertiser ID', placeholder: '7890123456789012345', example: '7890123456789012345 (Votre Compte Pub)' }
        ]
    },
    GA4: {
        label: 'Google Analytics 4',
        icon: '📊',
        fields: [
            { key: 'propertyId', label: 'GA4 Property ID', placeholder: '417713819', example: '417713819 (Numérique)' },
            { key: 'clientEmail', label: 'Service Account Email', placeholder: 'pilot-ga4-sync@project.iam.gserviceaccount.com', example: 'Votre mail de service (se termine par iam.gserviceaccount.com)' },
            { key: 'privateKey', label: 'Service Account Private Key', placeholder: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----', example: 'Copier tout le bloc PEM (multilignes)', type: 'textarea' },
            { key: 'projectId', label: 'Google Cloud Project ID', placeholder: 'radiant-micron-123456', example: 'L\'ID de votre projet GCP' }
        ]
    }
};

export default function ConnectionsPage() {
    const { data: session } = useSession();
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [limitReached, setLimitReached] = useState(false);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    // Sync All Handler
    // Sync All Handler
    const handleSyncAll = async () => {
        setSyncingId('ALL');
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullSync: true }) // Force Global Sync from here
            });
            const data = await res.json();

            if (data.jobId) {
                // Poll for completion
                const pollId = setInterval(async () => {
                    try {
                        const sRes = await fetch('/api/sync/status');
                        const sData = await sRes.json();

                        // We assume we are checking the LATEST job, which should be ours or newer
                        if (sData.status === 'done') {
                            setProgress(100);
                            clearInterval(pollId);
                            setSyncingId(null);

                            if (sData.jobStatus === 'partial_success') {
                                console.warn(`Synchronisation terminée avec avertissements :\n${sData.error || sData.message}`);
                            } else {
                                console.log("Synchronisation Complète Terminée ✅");
                            }

                            fetchConnections();
                            window.location.reload();
                        } else if (sData.status === 'error') {
                            clearInterval(pollId);
                            setSyncingId(null);
                            alert(`Erreur détaillée :\n${sData.error || sData.message || 'Inconnue'}`);
                        } else {
                            // Running
                            setProgress(sData.progress || 10);
                        }
                    } catch (e) { clearInterval(pollId); setSyncingId(null); }
                }, 2000);
            } else {
                setSyncingId(null);
                alert(data.error || "Erreur de démarrage de la sync.");
            }
        } catch (e) {
            setSyncingId(null);
            alert("Erreur réseau");
        }
    };

    // Unified Poller (Extracted from handleSyncAll)
    const pollSync = (jobId: string) => {
        const pollId = setInterval(async () => {
            try {
                const sRes = await fetch('/api/sync/status');
                const sData = await sRes.json();

                if (sData.status === 'done') {
                    setProgress(100);
                    clearInterval(pollId);
                    setSyncingId(null);
                    fetchConnections();
                    window.location.reload();
                } else if (sData.status === 'error') {
                    clearInterval(pollId);
                    setSyncingId(null);
                    alert(`Erreur: ${sData.error || sData.message}`);
                } else {
                    setProgress(sData.progress || 10);
                }
            } catch (e) { clearInterval(pollId); setSyncingId(null); }
        }, 2000);
    };

    // Handle Single Sync
    const handleSyncOne = async (connectionId: string) => {
        if (syncingId) return;
        setSyncingId(connectionId);
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullSync: true, connectionId }) // Force Full, Targeted
            });
            const data = await res.json();
            if (data.jobId) {
                pollSync(data.jobId);
            }
        } catch (e) {
            setSyncingId(null);
            alert("Erreur lancement sync");
        }
    };

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    // Guide State
    const [showGuide, setShowGuide] = useState(false);
    const [guideInitialProvider, setGuideInitialProvider] = useState<string | null>(null);

    const openGuide = (providerKey?: string) => {
        setGuideInitialProvider(providerKey || null);
        setShowGuide(true);
    };

    // Fetch Connections
    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/connections');
            if (res.ok) {
                const data = await res.json();
                setConnections(data);

                // Check limit locally for UI feedback (Server enforces too)
                // Limit Removed for Multi-Connection Feature
                setLimitReached(false);
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
        const config = PROVIDERS[selectedProvider as keyof typeof PROVIDERS];
        if (!config || !config.fields) return null;

        return (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {config.fields.map((field: any) => (
                    <div key={field.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {field.label || field.key.toUpperCase()}
                            </label>
                            {field.example && (
                                <div className="group relative cursor-help">
                                    <span style={{ fontSize: '0.7rem', color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, border: '1px solid #e0e7ff' }}>
                                        Format attendu
                                    </span>
                                    <div className="absolute right-0 bottom-full mb-2 w-max max-w-[250px] p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-normal">
                                        Ex: {field.example}
                                        <div className="absolute bottom-[-4px] right-3 w-2 h-2 bg-slate-800 rotate-45 transform"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {
                            field.type === 'textarea' || field.key === 'privateKey' ? (
                                <textarea
                                    className="input-premium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                    value={formData[field.key] || ''}
                                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                    placeholder={field.placeholder || ''}
                                    rows={6}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                                        border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
                                        color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'monospace', lineHeight: 1.4
                                    }}
                                />
                            ) : (
                                <input
                                    className="input-premium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                    type={field.key.toLowerCase().includes('token') || field.key.includes('secret') || (field.key.includes('key') && !field.key.includes('public')) ? 'password' : 'text'}
                                    value={formData[field.key] || ''}
                                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                    placeholder={field.placeholder || ''}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                                        border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
                                        color: 'var(--text-primary)', fontSize: '0.9rem'
                                    }}
                                />
                            )
                        }
                        {
                            field.example && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <span style={{ opacity: 0.7 }}>Exemple:</span>
                                    <span style={{ fontFamily: 'monospace', opacity: 0.9, background: 'var(--bg-hover)', padding: '1px 4px', borderRadius: '4px' }}>
                                        {field.example.length > 50 ? field.example.substring(0, 48) + '...' : field.example}
                                    </span>
                                </div>
                            )
                        }
                    </div>
                ))
                }
            </div >
        );
    };

    const renderProviderButton = (key: string) => {
        const info = PROVIDERS[key as keyof typeof PROVIDERS];
        if (!info) return null;

        // Amazon Ads / TikTok might be coming soon
        const isComingSoon = key === 'AMAZON_ADS';

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
                className="group relative"
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
                <div><BrandIcon provider={key} size={50} /></div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{info.label}</div>

                {/* Status Badges */}
                {isComingSoon && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.7rem', background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>Bientôt</div>}

                {/* Help Trigger */}
                {!isComingSoon && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            openGuide(key);
                        }}
                        style={{ position: 'absolute', top: 10, right: 10 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600"
                        title="Voir le guide"
                    >
                        <HelpCircle size={18} />
                    </div>
                )}
            </button>
        );
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Integrations</h1>
                        <button
                            onClick={() => openGuide()}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                        >
                            <HelpCircle size={16} /> Guide de connexion
                        </button>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>Connectez vos sources de données pour alimenter PILOT.</p>
                </div>
                {connections.length > 0 && (
                    <button
                        onClick={handleSyncAll}
                        disabled={syncingId !== null}
                        style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                            padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600,
                            position: 'relative', overflow: 'hidden'
                        }}
                    >
                        {syncingId === 'ALL' && (
                            <div style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                width: `${progress}%`, background: '#dcfce7',
                                transition: 'width 0.5s ease', zIndex: 0
                            }} />
                        )}
                        <span style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <RefreshCw size={18} className={syncingId === 'ALL' ? 'animate-spin' : ''} />
                            {syncingId === 'ALL' ? `Sync... ${Math.round(progress)}%` : 'Synchroniser Tout'}
                        </span>
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
                                <div><BrandIcon provider={c.provider} size={40} /></div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: c.status === 'ACTIVE' ? 'var(--accent-teal)' : (c.status === 'NEEDS_SYNC' ? '#f59e0b' : 'var(--text-muted)')
                                        }} />
                                        {c.status}
                                        {c.lastSyncAt && <span>• Sync: {new Date(c.lastSyncAt).toLocaleDateString()}</span>}
                                    </div>
                                    {c.status === 'NEEDS_SYNC' && (
                                        <div style={{ marginTop: '0.5rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                            <AlertCircle size={16} /> Synchro complète requise
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleSyncOne(c.id)}
                                    disabled={!!syncingId}
                                    title="Synchroniser cette source uniquement"
                                    style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                                    className={syncingId ? 'opacity-50' : 'hover:bg-blue-50 rounded-full transition-colors'}
                                >
                                    <RefreshCw size={18} className={syncingId === c.id ? 'animate-spin' : ''} />
                                </button>
                                <button
                                    onClick={() => handleDelete(c.id)}
                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                                    title="Supprimer la connexion"
                                    className="hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Connection Groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                {/* 1. VENTE */}
                <section style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        VENTE / MARKETPLACE
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Sources générant votre chiffre d'affaires.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
                        {renderProviderButton('WOOCOMMERCE')}
                        {renderProviderButton('SHOPIFY')}
                        {renderProviderButton('AMAZON_SELLER')}
                    </div>
                </section>

                {/* 2. MARKETING */}
                <section style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        MARKETING (ADS)
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Sources d'acquisition (Dépenses publicitaires).</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
                        {renderProviderButton('GOOGLE_ADS')}
                        {renderProviderButton('META_ADS')}
                        {renderProviderButton('TIKTOK_ADS')}
                        {renderProviderButton('AMAZON_ADS')}
                    </div>
                </section>

                {/* 3. DATA */}
                <section style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        DATA / ANALYTICS
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Contexte, trafic et attribution.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', justifyContent: 'center' }}>
                        {renderProviderButton('GA4')}
                    </div>
                </section>

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
                        borderRadius: '16px', padding: '2rem', boxShadow: 'var(--shadow-lg)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BrandIcon provider={selectedProvider} size={32} /> Configurer {PROVIDERS[selectedProvider as keyof typeof PROVIDERS].label}
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

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'transparent', border: '1px solid var(--border-subtle)', padding: '0.6rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    background: 'var(--primary-gradient)', color: '#fff', border: 'none',
                                    padding: '0.6rem 2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
                                }}
                            >
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                {saving ? 'Test & Sauvegarde...' : 'Connecter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConnectionGuideSheet
                visible={showGuide}
                onClose={() => setShowGuide(false)}
                initialProvider={guideInitialProvider}
                onSelectProvider={(p) => {
                    setShowGuide(false);
                    setSelectedProvider(p);
                    setShowModal(true);
                }}
            />
        </div>
    );
}
