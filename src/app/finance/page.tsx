"use client";

import React, { useMemo } from 'react';
import styles from './finance.module.css';
import KPICard from '@/components/KPICard';
import BusinessChart from '@/components/BusinessChart';
import { MOCK_FINANCIALS, MOCK_MONTHLY_DATA, MOCK_CHANNELS } from '@/services/mockData';
import { Wallet, TrendingUp, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { BusinessEngine } from '@/lib/engine';

export default function FinancePage() {
    const { settings } = useApp();

    // Recalculate Logic based on User Settings
    const computed = useMemo(() => {
        // Start with the raw gross revenue from "Mocks" (simulating API source)
        const rawRevenue = MOCK_FINANCIALS.revenue_gross;
        const rawAdSpend = MOCK_FINANCIALS.ad_spend_total;
        const estimatedOrders = 1450; // Mock order count

        return BusinessEngine.calculateProfit(rawRevenue, rawAdSpend, estimatedOrders, settings);
    }, [settings]); // Re-run when settings change

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Finance Intelligence</h1>
                <p className={styles.subtitle}>
                    Analytique temps réel.
                    <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', padding: '2px 6px', borderRadius: '4px' }}>
                        Basé sur profil : Marge {(settings.costProfile.cogsEsitmatedPercent).toFixed(0)}%
                    </span>
                </p>
            </div>

            {/* KPI Cards */}
            <div className={styles.grid}>
                <KPICard
                    title="CA Net Estimé"
                    value={`${computed.revenueNet?.toLocaleString()} €`}
                    trendValue={15}
                    icon={DollarSign}
                />
                <KPICard
                    title="Profit Réel Estimé"
                    value={`${computed.profitEstimated?.toLocaleString()} €`}
                    trendValue={8.4}
                    icon={Wallet}
                />
                <KPICard
                    title="Marge Nette"
                    value={`${computed.profitMarginPercent?.toFixed(1)}%`}
                    trendValue={-1.2}
                    icon={Percent}
                />
                <KPICard
                    title="Frais & Coûts"
                    value={`${((computed.costOfGoods || 0) + (computed.shippingCost || 0) + (computed.transactionFees || 0)).toLocaleString()} €`}
                    trendValue={2.1}
                    icon={TrendingUp}
                />
            </div>

            {/* AI Advice Banner */}
            <div className={styles.glassCard} style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <AlertCircle className="text-gold" />
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 500 }}>Note du Système :</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                        Le calcul du profit prend en compte <strong>{(computed.shippingCost || 0).toLocaleString()}€</strong> de frais de port et <strong>{(computed.transactionFees || 0).toLocaleString()}€</strong> de frais de paiement.
                    </span>
                </div>
            </div>

            {/* Charts Section */}
            <div className={styles.chartSection}>
                {/* Main Chart: Profit vs Revenue */}
                <div className={styles.glassCard}>
                    <div className={styles.cardTitle}>
                        <span>Évolution Revenue vs Profit</span>
                        <select style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none' }}>
                            <option>6 derniers mois</option>
                            <option>Cette année</option>
                        </select>
                    </div>
                    <BusinessChart
                        data={MOCK_MONTHLY_DATA}
                        type="area"
                        dataKey1="revenue"
                        dataKey2="profit"
                        color1="#3b82f6"
                        color2="#10B981"
                    />
                </div>

                {/* Side Panel: Channel Performance */}
                <div className={styles.glassCard}>
                    <div className={styles.cardTitle}>Rentabilité par Canal</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {MOCK_CHANNELS.map((channel, i) => (
                            <div key={i} className={styles.channelRow}>
                                <div className={styles.channelName}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: channel.roas > 3 ? '#10B981' : '#EF4444' }} />
                                    {channel.channel}
                                </div>
                                <div className={styles.channelMetric}>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{channel.roas}x</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ROAS</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '2rem' }}>
                        <BusinessChart
                            data={MOCK_CHANNELS}
                            type="bar"
                            dataKey1="revenue"
                            height={150}
                            color1="var(--accent-gold)"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
