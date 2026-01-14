"use client";

import React from 'react';
import styles from './products.module.css';
import KPICard from '@/components/KPICard';
import { MOCK_PRODUCTS } from '@/services/mockData';
import { Package, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

export default function ProductsPage() {
    const topProduct = MOCK_PRODUCTS.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current);
    const toxicProducts = MOCK_PRODUCTS.filter(p => p.status === 'toxic');
    const avgMargin = (MOCK_PRODUCTS.reduce((acc, curr) => acc + curr.margin, 0) / MOCK_PRODUCTS.length).toFixed(1);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Produits & Offres</h1>
                <p className={styles.subtitle}>Identifiez vos produits héros et coupez les offres toxiques.</p>
            </div>

            <div className={styles.statsGrid}>
                <KPICard
                    title="Top Produit (Revenu)"
                    value={topProduct.revenue.toLocaleString() + " €"}
                    trend="up"
                    trendValue={topProduct.trend}
                    icon={Package}
                />
                <KPICard
                    title="Marge Moyenne"
                    value={`${avgMargin}%`}
                    trendValue={-2.1}
                    icon={TrendingUp}
                />
                <KPICard
                    title="Produits Toxiques"
                    value={toxicProducts.length.toString()}
                    trendValue={0}
                    icon={AlertTriangle}
                />
            </div>

            <div className={styles.grid}>
                {/* Main Product Table */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Analyse Détaillée du Catalogue</h2>
                    <table className={styles.productTable}>
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Revenu</th>
                                <th>Dépense Pub</th>
                                <th>Marge %</th>
                                <th>Status</th>
                                <th>Action IA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_PRODUCTS.map((product) => (
                                <tr key={product.id} className={styles.productRow}>
                                    <td style={{ fontWeight: 500 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{product.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.sku}</span>
                                        </div>
                                    </td>
                                    <td>{product.revenue.toLocaleString()} €</td>
                                    <td>{product.adSpend.toLocaleString()} €</td>
                                    <td style={{
                                        color: product.margin > 40 ? '#10B981' : product.margin < 20 ? '#EF4444' : 'var(--text-primary)',
                                        fontWeight: 600
                                    }}>
                                        {product.margin}%
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${product.status === 'hero' ? styles.badgeHero :
                                            product.status === 'toxic' ? styles.badgeToxic :
                                                product.status === 'sleeper' ? styles.badgeSleeper : styles.badgeNormal
                                            }`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className={styles.actionBtn}>
                                            <Zap size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                            {product.aiAction}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Side Panel: Toxic Alerts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle} style={{ color: '#EF4444' }}>
                            <AlertTriangle size={18} /> Alertes Critiques
                        </h2>
                        {toxicProducts.length > 0 ? toxicProducts.map(p => (
                            <div key={p.id} className={styles.toxicCard}>
                                <div className={styles.toxicTitle}>
                                    {p.name}
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    Ce produit consomme <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{p.adSpend}€</span> de pub pour une marge de seulement <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{p.margin}%</span>.
                                </p>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#EF4444' }}>
                                    &rarr; Couper Pub Immédiatement
                                </div>
                            </div>
                        )) : (
                            <p style={{ color: 'var(--text-secondary)' }}>Aucun produit toxique détecté.</p>
                        )}
                    </div>

                    {/* Hero Highlight */}
                    <div className={styles.section} style={{ border: '1px solid rgba(212, 175, 55, 0.3)', background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
                        <h2 className={styles.sectionTitle} style={{ color: 'var(--accent-gold)' }}>
                            <Zap size={18} /> Opportunité
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Le produit <strong>Montre Chrono Silver</strong> a un ROAS exceptionnel. Augmentez le budget de 20% pour scaler les ventes sans dégrader la marge.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
