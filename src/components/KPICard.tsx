import React from 'react';
import styles from './KPICard.module.css';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string;
    trend?: string;
    trendValue?: number; // e.g. +12%
    icon?: LucideIcon;
}

export default function KPICard({ title, value, trend, trendValue, icon: Icon }: KPICardProps) {
    const isPositive = trendValue && trendValue > 0;
    const isNegative = trendValue && trendValue < 0;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <span className={styles.title}>{title}</span>
                {Icon && <Icon size={20} className="text-silver" style={{ opacity: 0.5 }} />}
            </div>
            <div className={styles.value}>{value}</div>
            {(trend || trendValue) && (
                <div className={styles.footer}>
                    <span className={
                        isPositive ? styles.trendPositive :
                            isNegative ? styles.trendNegative :
                                styles.trendNeutral
                    }>
                        {isPositive ? '+' : ''}{trendValue}%
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>vs période préc.</span>
                </div>
            )}
        </div>
    );
}
