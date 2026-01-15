"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Save, Play, Calendar, BarChart2 } from 'lucide-react';
import { toCsv } from '@/lib/exports/toCsv';
import { downloadFile } from '@/lib/exports/downloadFile';

interface ReportBuilderProps {
    organizationId: string;
}

export default function ReportBuilder({ organizationId }: ReportBuilderProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [reportName, setReportName] = useState('');

    // Default Config
    const [config, setConfig] = useState({
        metrics: ['revenue_gross', 'spend', 'profit_estimated', 'margin_percent'],
        granularity: 'day',
        range: {
            start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        }
    });

    const runReport = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/reports/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    config: { metrics: config.metrics, dimensions: ['date'] },
                    range: config.range
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Report execution failed');
            }

            const data = await res.json();
            setResult(data);
        } catch (e: any) {
            console.error(e);
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!reportName) return;
        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: reportName,
                    config: config, // Save full config
                    organizationId
                })
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Save failed');
            }

            setShowSaveModal(false);
            router.push('/reports'); // Redirect to library after save
            router.refresh();

        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

            {/* Left Panel: Configuration */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', height: 'fit-content' }}>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={20} /> Configuration
                </h3>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Date Range</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input type="date" value={config.range.start}
                            onChange={e => setConfig({ ...config, range: { ...config.range, start: e.target.value } })}
                            style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text)' }}
                        />
                        <input type="date" value={config.range.end}
                            onChange={e => setConfig({ ...config, range: { ...config.range, end: e.target.value } })}
                            style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text)' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Granularity</label>
                    <select value={config.granularity}
                        onChange={e => setConfig({ ...config, granularity: e.target.value as any })}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                        <option value="day">Daily</option>
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                    </select>
                </div>

                <button onClick={runReport} disabled={loading}
                    style={{
                        width: '100%', padding: '0.8rem', background: 'var(--primary-gradient)', color: 'white',
                        border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    <Play size={18} fill="currentColor" />
                    {loading ? 'Processing...' : 'Generate Report'}
                </button>
            </div>

            {/* Right Panel: Preview */}
            <div style={{ minHeight: '400px' }}>
                {!result ? (
                    <div style={{
                        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px dashed var(--border)', borderRadius: '12px', color: 'var(--muted)',
                        flexDirection: 'column', gap: '1rem'
                    }}>
                        <BarChart2 size={48} opacity={0.2} />
                        <p>Configure and run the report to see the analysis.</p>
                    </div>
                ) : (
                    <div>
                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                            {[
                                { label: 'Revenue', val: result.summary.total_revenue, fmt: 'currency' },
                                { label: 'Ad Spend', val: result.summary.total_spend, fmt: 'currency' },
                                { label: 'Net Profit', val: result.summary.total_profit, fmt: 'currency', color: true },
                                { label: 'Margin', val: result.summary.global_margin, fmt: 'percent' },
                            ].map((kpi, i) => (
                                <div key={i} style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>{kpi.label}</div>
                                    <div style={{
                                        fontSize: '1.2rem', fontWeight: 700,
                                        color: kpi.color ? (kpi.val > 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text)'
                                    }}>
                                        {kpi.fmt === 'currency'
                                            ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(kpi.val)
                                            : `${kpi.val.toFixed(1)}%`
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Results</h3>
                            <button onClick={() => setShowSaveModal(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'var(--text)', color: 'white', border: 'none', padding: '0.5rem 1rem',
                                    borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer'
                                }}
                            >
                                <Save size={16} /> Save Report
                            </button>
                        </div>

                        {/* Data Table */}
                        <div style={{ overflowX: 'auto', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                                    <tr>
                                        <th style={{ padding: '0.8rem', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>Revenue</th>
                                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>Spend</th>
                                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>Profit</th>
                                        <th style={{ padding: '0.8rem', textAlign: 'right' }}>Margin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.series.map((row: any) => (
                                        <tr key={row.date} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.8rem' }}>{row.date}</td>
                                            <td style={{ padding: '0.8rem', textAlign: 'right' }}>{row.revenue_gross.toFixed(0)}€</td>
                                            <td style={{ padding: '0.8rem', textAlign: 'right' }}>{row.spend.toFixed(0)}€</td>
                                            <td style={{ padding: '0.8rem', textAlign: 'right', color: row.profit_estimated > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                {row.profit_estimated.toFixed(0)}€
                                            </td>
                                            <td style={{ padding: '0.8rem', textAlign: 'right' }}>{row.margin_percent.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'var(--surface)', width: '400px', padding: '2rem',
                        borderRadius: '16px', border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <h3 style={{ marginTop: 0, fontSize: '1.2rem' }}>Save to Library</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Give this report a name to easily access it later.</p>

                        <input value={reportName} onChange={e => setReportName(e.target.value)}
                            placeholder="e.g. Weekly Profit & Loss" autoFocus
                            style={{
                                width: '100%', padding: '0.75rem', marginBottom: '1.5rem',
                                border: '1px solid var(--border)', borderRadius: '8px',
                                background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowSaveModal(false)}
                                style={{
                                    padding: '0.6rem 1rem', background: 'transparent',
                                    border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
                                    color: 'var(--muted)'
                                }}
                            >Cancel</button>
                            <button onClick={handleSave}
                                style={{
                                    padding: '0.6rem 1rem', background: 'var(--primary-gradient)',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    color: 'white', fontWeight: 600
                                }}
                            >Save Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
