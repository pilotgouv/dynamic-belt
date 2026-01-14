"use client";

import React from 'react';
import styles from './ads.module.css';
import KPICard from '@/components/KPICard';
import BusinessChart from '@/components/BusinessChart';
import { MOCK_ADS_PERFORMANCE, MOCK_ADS_TREND } from '@/services/mockData';
import { Megaphone, Award, Target, MousePointer, DollarSign } from 'lucide-react';

export default function AdsPage() {
    const totalSpend = MOCK_ADS_PERFORMANCE.reduce((acc, curr) => acc + curr.cost, 0);
    const totalConversions = MOCK_ADS_PERFORMANCE.reduce((acc, curr) => acc + curr.conversions, 0);
    const avgRoas = (MOCK_ADS_PERFORMANCE.reduce((acc, curr) => acc + curr.roas, 0) / MOCK_ADS_PERFORMANCE.length).toFixed(2);
    const avgCPA = (totalSpend / totalConversions).toFixed(2);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Publicité & Performance</h1>
                <p className={styles.subtitle}>Analysez le ROI réel de vos campagnes multi-canaux.</p>
            </div>

            {/* KPI Stats */}
            <div className={styles.grid}>
                <KPICard
                    title="Dépenses Totales"
                    value={`${totalSpend.toLocaleString()} €`}
                    trendValue={5.2}
                    icon={DollarSign}
                />
                <KPICard
                    title="ROAS Global"
                    value={`${avgRoas}x`}
                    trendValue={-0.4}
                    icon={Award}
                />
                <KPICard
                    title="Conversions"
                    value={totalConversions.toString()}
                    trendValue={12.1}
                    icon={Target}
                />
                <KPICard
                    title="Coût par Action (CPA)"
                    value={`${avgCPA} €`}
                    trendValue={-2.5}
                    icon={MousePointer}
                />
            </div>

            {/* Main Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Tendances Semaine (Dépenses vs ROAS)</h2>
                    <BusinessChart
                        data={MOCK_ADS_TREND}
                        type="area"
                        dataKey1="spend"
                        height={300}
                        color1="#3b82f6"
                    />
                </div>

                {/* Alerts / Insights Panel */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Alertes Performance</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.875rem', color: '#EF4444' }}>
                            <span style={{ fontWeight: 'bold' }}>TikTok Ads</span> : CPC en hausse de +15% sur les 3 derniers jours.
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '0.875rem', color: '#10B981' }}>
                            <span style={{ fontWeight: 'bold' }}>Meta Ads</span> : Campagne "Retargeting" performe à 4.2 ROAS.
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Platform Table */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Performance par Plateforme</h2>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Plateforme</th>
                            <th>Statut</th>
                            <th style={{ textAlign: 'right' }}>Dépenses</th>
                            <th style={{ textAlign: 'right' }}>Clics</th>
                            <th style={{ textAlign: 'right' }}>CPC Moy.</th>
                            <th style={{ textAlign: 'right' }}>Conversions</th>
                            <th style={{ textAlign: 'right' }}>ROAS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_ADS_PERFORMANCE.map((ad, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 500 }}>
                                    <Megaphone size={14} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                                    {ad.platform}
                                </td>
                                <td>
                                    <span className={ad.status === 'active' ? styles.statusActive : styles.statusWarning}></span>
                                    {ad.status === 'active' ? 'Actif' : 'Attention'}
                                </td>
                                <td style={{ textAlign: 'right' }}>{ad.cost.toLocaleString()} €</td>
                                <td style={{ textAlign: 'right' }}>{ad.clicks.toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>{ad.cpc} €</td>
                                <td style={{ textAlign: 'right' }}>{ad.conversions}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: ad.roas > 3.5 ? '#10B981' : ad.roas < 3.0 ? '#EF4444' : 'var(--text-primary)' }}>
                                    {ad.roas}x
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
