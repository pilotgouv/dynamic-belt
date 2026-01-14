"use client";

import React, { useMemo } from 'react';
import styles from './alerts.module.css';
import { useApp } from '@/hooks/useApp';
import { BusinessEngine } from '@/lib/engine';
import { MOCK_FINANCIALS, MOCK_CHANNELS } from '@/services/mockData';
import { AlertTriangle, AlertCircle, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { AdsChannelMetric } from '@/types/data';

export default function AlertsPage() {
    const { settings } = useApp();

    // 1. Calculate Real Business Metrics
    const computedFinance = useMemo(() => {
        return BusinessEngine.calculateProfit(
            MOCK_FINANCIALS.revenue_gross,
            MOCK_FINANCIALS.ad_spend_total,
            1450,
            settings
        );
    }, [settings]);

    // 2. Mock Transformation for Ads (to fit type)
    // In V2 this comes from API
    const computedAds: AdsChannelMetric[] = MOCK_CHANNELS.map(c => ({
        date: 'today',
        channel: c.channel as any,
        spend: c.spend,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        conversionValue: c.revenue,
        roas: c.roas,
        cpa: 0
    }));

    // 3. Generate Logic-Based Alerts
    const alerts = useMemo(() => {
        return BusinessEngine.generateAlerts(computedFinance, computedAds, settings.targets);
    }, [computedFinance, computedAds, settings]);

    const criticalCount = alerts.filter(a => a.type === 'critical').length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Alertes & Intelligence Artificielle</h1>
                <p className={styles.subtitle}>
                    Surveillance 24/7 basée sur vos règles métier.
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        (Cible Marge: {settings.targets.minMargin}%)
                    </span>
                </p>
            </div>

            {/* AI Daily Summary */}
            <div className={styles.aiHeader}>
                <div className={styles.aiTitle}>
                    <Sparkles size={18} /> Résumé du Jour
                </div>
                <p className={styles.aiSummary}>
                    {criticalCount > 0 ? (
                        <span className="text-red-500">Attention, des indicateurs critiques nécessitent votre action immédiate.</span>
                    ) : (
                        <span className="text-green-500">Tous les voyants sont au vert aujourd&apos;hui.</span>
                    )}
                    <br /><br />
                    Votre profit estimé est de <strong>{computedFinance.profitEstimated?.toLocaleString()}€</strong>.
                    {alerts.length > 0 && ` Nous avons détecté ${alerts.length} anomalies potentielles.`}
                </p>
            </div>

            <div style={{ padding: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
                Notifications Temps Réel ({criticalCount} critiques)
            </div>

            {/* Alert Feed */}
            <div className={styles.feed}>
                {alerts.length === 0 && (
                    <div className={styles.alertCard} style={{ justifyContent: 'center', opacity: 0.5 }}>
                        Aucune alerte à signaler.
                    </div>
                )}

                {alerts.map((alert, idx) => (
                    <div key={idx} className={styles.alertCard} style={{
                        borderLeft: `4px solid ${alert.type === 'critical' ? '#EF4444' :
                                alert.type === 'warning' ? '#F59E0B' : '#3b82f6'
                            }`
                    }}>
                        <div className={styles.alertIcon}>
                            {alert.type === 'critical' ? <AlertTriangle size={20} color="#EF4444" /> :
                                alert.type === 'warning' ? <AlertCircle size={20} color="#F59E0B" /> :
                                    <Info size={20} color="#3b82f6" />}
                        </div>
                        <div className={styles.alertContent}>
                            <div className={styles.alertMessage}>{alert.message}</div>
                            <div className={styles.alertMeta}>
                                <span className={styles.categoryTag} style={{
                                    color: alert.category === 'finance' ? '#10B981' : alert.category === 'ads' ? '#3b82f6' : '#F59E0B'
                                }}>
                                    {alert.category}
                                </span>
                                <span>•</span>
                                <span>À l&apos;instant</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
