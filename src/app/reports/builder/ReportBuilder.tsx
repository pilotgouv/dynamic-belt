"use client";

import React, { useState } from 'react';
import styles from '../reports.module.css';
import { toCsv } from '@/lib/exports/toCsv';
import { downloadFile } from '@/lib/exports/downloadFile';
import { ReportExportMeta } from '@/lib/exports/reportExportTypes';
import { Download } from 'lucide-react';

interface ReportConfig {
    metrics: string[];
    granularity: 'day' | 'week' | 'month';
    range: { start: string; end: string };
}

export default function ReportBuilder() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [config, setConfig] = useState<ReportConfig>({
        metrics: ['revenue_gross', 'spend', 'profit_estimated'],
        granularity: 'day',
        range: {
            start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
            end: new Date().toISOString().split('T')[0]
        }
    });

    const runReport = async () => {
        setLoading(true);
        try {
            // Mock fetching Organization ID for prototype context
            // In real app, use a Context or fetch user's first org
            const organizationId = '6f2e9c1b-4d3a-4b5c-8d6e-7f8a9b0c1d2e'; // Replace with dynamic ID

            const res = await fetch('/api/reports/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    config: { metrics: config.metrics, dimensions: ['date'] },
                    range: config.range
                })
            });

            if (!res.ok) throw new Error('Report Failed');

            const data = await res.json();
            setResult(data);
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la génération du rapport check console. (Make sure DB migration is applied!)");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type: 'table' | 'series') => {
        if (!result) return;

        const meta: ReportExportMeta = {
            organizationName: 'Mon Organisation', // Dynamic later
            generatedAt: new Date().toISOString(),
            period: config.range,
            granularity: config.granularity,
            confidence: result.confidence,
            confidenceReasons: result.confidenceReasons
        };

        let csv = '';
        if (type === 'table') {
            // For table, we export the series but maybe formatted differently later.
            // For now, series IS the table source.
            csv = toCsv(result.series, meta);
        } else {
            csv = toCsv(result.series, meta);
        }

        const filename = `PILOT_Report_${config.range.start}_${config.granularity}.csv`;
        downloadFile(csv, filename);
        setShowExportMenu(false);
    };

    return (
        <div className={styles.builderContainer}>
            <div className={styles.controls}>
                <h3>Configuration</h3>

                <div className={styles.controlGroup}>
                    <label>Période</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="date"
                            className={styles.input}
                            value={config.range.start}
                            onChange={e => setConfig({ ...config, range: { ...config.range, start: e.target.value } })}
                        />
                        <input
                            type="date"
                            className={styles.input}
                            value={config.range.end}
                            onChange={e => setConfig({ ...config, range: { ...config.range, end: e.target.value } })}
                        />
                    </div>
                </div>

                <div className={styles.controlGroup}>
                    <label>Granularité</label>
                    <select
                        className={styles.select}
                        value={config.granularity}
                        onChange={e => setConfig({ ...config, granularity: e.target.value as any })}
                    >
                        <option value="day">Jour</option>
                        <option value="week">Semaine</option>
                        <option value="month">Mois</option>
                    </select>
                </div>

                <button
                    className={styles.runButton}
                    onClick={runReport}
                    disabled={loading}
                >
                    {loading ? 'Calcul en cours...' : 'Générer le Rapport'}
                </button>

                {result && (
                    <div style={{ position: 'relative', marginTop: '1rem' }}>
                        <button
                            className={styles.secondaryButton}
                            onClick={() => setShowExportMenu(!showExportMenu)}
                        >
                            <Download size={16} style={{ marginRight: 6 }} /> Exporter
                        </button>

                        {showExportMenu && (
                            <div className={styles.dropdownMenu}>
                                <div className={styles.dropdownItem} onClick={() => handleExport('table')}>
                                    Export CSV (Tableau)
                                </div>
                                <div className={styles.dropdownItem} onClick={() => handleExport('series')}>
                                    Export CSV (Série Temporelle)
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.preview}>
                {!result ? (
                    <div className={styles.emptyState}>Configurez et générez votre rapport pour voir l'aperçu.</div>
                ) : (
                    <div>
                        <div className={styles.summaryBar}>
                            <div className={styles.kpi}>
                                <span>Chiffre d'Affaires</span>
                                <strong>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(result.summary.total_revenue)}</strong>
                            </div>
                            <div className={styles.kpi}>
                                <span>Dépenses Ads</span>
                                <strong>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(result.summary.total_spend)}</strong>
                            </div>
                            <div className={styles.kpi}>
                                <span>Profit Net (Est.)</span>
                                <strong style={{ color: result.summary.total_profit > 0 ? '#4ade80' : '#ef4444' }}>
                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(result.summary.total_profit)}
                                </strong>
                            </div>
                            <div className={styles.kpi}>
                                <span>Marge Globale</span>
                                <strong>{result.summary.global_margin.toFixed(1)}%</strong>
                            </div>
                        </div>

                        {/* Table Preview */}
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>CA</th>
                                    <th>Ads Spend</th>
                                    <th>Profit</th>
                                    <th>Marge %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.series.map((row: any) => (
                                    <tr key={row.date}>
                                        <td>{row.date}</td>
                                        <td>{row.revenue_gross.toFixed(0)}€</td>
                                        <td>{row.spend.toFixed(0)}€</td>
                                        <td style={{ color: row.profit_estimated > 0 ? '#4ade80' : '#ef4444' }}>
                                            {row.profit_estimated.toFixed(0)}€
                                        </td>
                                        <td>{row.margin_percent.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className={styles.confidenceBadge}>
                            Confiance des données: <strong>{result.confidence}</strong>
                            <br />
                            <small>{result.confidenceReasons.join(', ')}</small>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
