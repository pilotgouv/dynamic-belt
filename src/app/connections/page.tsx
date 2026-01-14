"use client";

import React, { useState } from 'react';
import styles from './connections.module.css';
import { CheckCircle, AlertCircle, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

export default function ConnectionsPage() {
    const { connections, toggleConnection } = useApp();
    // Using global state for connections instead of local mock state

    const renderCard = (item: any) => {
        const isSyncing = item.status === 'syncing';
        const isConnected = item.status === 'connected';
        const isError = item.status === 'error';

        return (
            <div key={item.id} className={styles.card} style={{
                borderColor: isConnected ? 'rgba(16, 185, 129, 0.3)' : 'var(--glass-border)'
            }}>
                <div className={styles.cardHeader}>
                    <div className={styles.platformInfo}>
                        <div className={styles.platformIcon}>
                            {/* Simplified icon logic */}
                            {item.provider === 'shopify' ? '🛍️' : item.provider.includes('ads') ? '📊' : '📈'}
                        </div>
                        <div>
                            <span className={styles.platformName}>{item.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <span className={`${styles.status} ${isConnected ? styles.statusConnected :
                                        isError ? styles.statusError : styles.statusDisconnected
                                    }`}>
                                    {isSyncing ? 'Synchronisation...' :
                                        isConnected ? 'Connecté & Actif' :
                                            isError ? 'Erreur API' : 'Non connecté'}
                                </span>

                                {isSyncing && <Loader2 size={12} className="animate-spin text-silver" style={{ animation: 'spin 1s linear infinite' }} />}
                            </div>
                        </div>
                    </div>
                    {isConnected && <CheckCircle size={18} className="text-green" style={{ color: '#10B981' }} />}
                </div>

                {isError && (
                    <div style={{ fontSize: '0.75rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} /> Token expiré
                    </div>
                )}

                {item.lastSyncAt && isConnected && (
                    <div className={styles.lastSync}>
                        <RefreshCw size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Synchro : {item.lastSyncAt}
                    </div>
                )}

                <button
                    className={`${styles.button} ${isConnected ? styles.btnManage : styles.btnConnect}`}
                    onClick={() => toggleConnection(item.id)}
                    disabled={isSyncing}
                    style={{ position: 'relative', overflow: 'hidden' }}
                >
                    {isSyncing ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            Configuration...
                        </span>
                    ) : isConnected ? (
                        'Gérer / Déconnecter'
                    ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            Connecter <ArrowRight size={14} />
                        </span>
                    )}
                </button>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Connexions & Sources</h1>
                <p className={styles.subtitle}>Gérez vos intégrations via l&apos;API sécurisée (OAuth).</p>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>E-Commerce (CMS)</h2>
                <div className={styles.grid}>
                    {connections.filter(i => i.provider === 'shopify' || i.provider === 'woocommerce' || i.provider === 'amazon').map(renderCard)}
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Publicité</h2>
                <div className={styles.grid}>
                    {connections.filter(i => i.provider.includes('_ads')).map(renderCard)}
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Analytics & Trafic</h2>
                <div className={styles.grid}>
                    {connections.filter(i => i.provider === 'ga4').map(renderCard)}
                </div>
            </div>
        </div>
    );
}
