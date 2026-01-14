"use client";

import React, { useState } from 'react';
import styles from './settings.module.css';
import { useApp } from '@/hooks/useApp';
import { User, Bell, Shield, Coins, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
    const { settings, updateSettings } = useApp();
    const [profile, setProfile] = useState(settings.costProfile);
    const [targets, setTargets] = useState(settings.targets);

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: parseFloat(value) }));
    };

    const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTargets(prev => ({ ...prev, [name]: parseFloat(value) }));
    };

    const saveChanges = () => {
        updateSettings({ costProfile: profile, targets: targets });
        alert("Paramètres enregistrés. Les calculs de rentabilité ont été mis à jour.");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Paramètres & Coûts</h1>
                <p className={styles.subtitle}>Ajustez votre profil de coûts pour obtenir une rentabilité réelle.</p>
            </div>

            {/* Cost Profile Section - CRITICAL for Business Engine */}
            <div className={styles.section} style={{ border: '1px solid var(--accent-gold)' }}>
                <h2 className={styles.sectionTitle} style={{ color: 'var(--accent-gold)' }}>
                    <Coins size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                    Profil de Coûts (Estimatifs)
                </h2>
                <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Ces valeurs sont utilisées pour calculer votre <strong>Profit Réel Estimé</strong> en l'absence de données comptables exactes.
                </div>

                <div className={styles.row}>
                    <span className={styles.label}>Marge COGS Estimée (%)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            name="cogsEsitmatedPercent"
                            type="number"
                            className={styles.input}
                            value={profile.cogsEsitmatedPercent}
                            onChange={handleCostChange}
                        />
                        <span className={styles.unit}>% du CA</span>
                    </div>
                </div>

                <div className={styles.row}>
                    <span className={styles.label}>Frais Plateforme (%)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            name="platformFeesPercent"
                            type="number"
                            step="0.1"
                            className={styles.input}
                            value={profile.platformFeesPercent}
                            onChange={handleCostChange}
                        />
                        <span className={styles.unit}>% (Stripe/PayPal)</span>
                    </div>
                </div>

                <div className={styles.row}>
                    <span className={styles.label}>Coût d&apos;expédition moyen (€)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            name="shippingCostAvg"
                            type="number"
                            step="0.1"
                            className={styles.input}
                            value={profile.shippingCostAvg}
                            onChange={handleCostChange}
                        />
                        <span className={styles.unit}>€ / commande</span>
                    </div>
                </div>

                <div className={styles.row}>
                    <span className={styles.label}>Taux de retours moyen (%)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            name="returnRatePercent"
                            type="number"
                            className={styles.input}
                            value={profile.returnRatePercent}
                            onChange={handleCostChange}
                        />
                        <span className={styles.unit}>% du CA</span>
                    </div>
                </div>
            </div>

            {/* Profile Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <User size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                    Profil Utilisateur
                </h2>
                <div className={styles.row}>
                    <span className={styles.label}>Plan Actuel</span>
                    <span className={styles.value} style={{ color: 'var(--accent-gold)' }}>Premium</span>
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>Devise</span>
                    <select
                        className={styles.input}
                        value={settings.currency}
                        onChange={(e) => updateSettings({ currency: e.target.value as any })}
                    >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                    </select>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                    onClick={saveChanges}
                    style={{
                        background: 'var(--text-primary)',
                        color: 'var(--background)',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '1rem',
                        boxShadow: '0 4px 12px rgba(255,255,255,0.1)'
                    }}
                >
                    Sauvegarder et Recalculer
                </button>
            </div>
        </div>
    );
}
