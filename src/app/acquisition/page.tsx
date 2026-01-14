"use client";

import React from 'react';
import styles from './acquisition.module.css';
import KPICard from '@/components/KPICard';
import BusinessChart from '@/components/BusinessChart';
import { MOCK_TRAFFIC_SOURCES } from '@/services/mockData';
import { Users, MousePointer, ShoppingCart, Percent } from 'lucide-react';

export default function AcquisitionPage() {
    const totalSessions = MOCK_TRAFFIC_SOURCES.reduce((acc, curr) => acc + curr.sessions, 0);
    const avgConversionRate = (MOCK_TRAFFIC_SOURCES.reduce((acc, curr) => acc + curr.conversionRate, 0) / MOCK_TRAFFIC_SOURCES.length).toFixed(2);

    // Prepare data for bar chart
    const barChartData = MOCK_TRAFFIC_SOURCES.map(source => ({
        name: source.name,
        sessions: source.sessions
    }));

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Trafic & Acquisition</h1>
                <p className={styles.subtitle}>Comprenez d&apos;où viennent vos visiteurs et qui achète vraiment.</p>
            </div>

            <div className={styles.grid}>
                <KPICard
                    title="Sessions Totales"
                    value={totalSessions.toLocaleString()}
                    trendValue={15.4}
                    icon={Users}
                />
                <KPICard
                    title="Taux de Conversion"
                    value={`${avgConversionRate}%`}
                    trendValue={1.2}
                    icon={Percent}
                />
                <KPICard
                    title="Points de Rupture"
                    value="3"
                    trendValue={0}
                    icon={ShoppingCart}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Volume par Source</h2>
                    <BusinessChart
                        data={barChartData}
                        type="bar"
                        dataKey1="sessions"
                        height={300}
                        color1="#ffffff"
                    />
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Qualité du Trafic (Conversion)</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {MOCK_TRAFFIC_SOURCES.sort((a, b) => b.conversionRate - a.conversionRate).map((source, i) => (
                            <div key={i} className={styles.sourceRow}>
                                <div className={styles.sourceName} style={{ width: '120px' }}>{source.name}</div>
                                <div className={styles.barContainer}>
                                    <div
                                        className={styles.barFill}
                                        style={{
                                            width: `${(source.conversionRate / 5) * 100}%`,
                                            background: source.conversionRate > 3 ? '#10B981' : source.conversionRate > 2 ? '#F59E0B' : '#EF4444'
                                        }}
                                    />
                                </div>
                                <div className={styles.sourceValue}>{source.conversionRate}% Conv.</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
