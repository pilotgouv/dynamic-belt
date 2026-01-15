import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Plus, Calendar, ArrowRight, BarChart3, Clock } from 'lucide-react';
import styles from './reports.module.css'; // We'll keep using styles but might need to update css file too or use inline for premium vars

export const runtime = 'nodejs';

async function getReports(orgId: string) {
    return await prisma.reportDefinition.findMany({
        where: { organizationId: orgId },
        orderBy: { updatedAt: 'desc' },
        include: {
            runs: {
                take: 1,
                orderBy: { runAt: 'desc' },
                select: { status: true, runAt: true }
            }
        }
    });
}

export default async function ReportsPage() {
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    // Fallback if organizationId is missing (should not happen if logged in properly)
    // For now we assume user has orgId via session callback
    const orgId = (session.user as any).organizationId;
    if (!orgId) return <div style={{ padding: '2rem' }}>Error: No Organization found.</div>;

    const reports = await getReports(orgId);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Reports Library</h1>
                    <p style={{ color: 'var(--muted)' }}>Boardroom-ready intelligence summaries.</p>
                </div>
                <Link href="/reports/new"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'var(--primary-gradient)', color: 'white',
                        padding: '0.75rem 1.5rem', borderRadius: '8px',
                        fontWeight: 600, textDecoration: 'none',
                        boxShadow: 'var(--shadow-md)', transition: 'transform 0.2s'
                    }}
                >
                    <Plus size={18} />
                    New Report
                </Link>
            </header>

            {/* Content */}
            {reports.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '4rem',
                    background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ width: '64px', height: '64px', background: 'var(--surface-2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--muted)' }}>
                        <FileText size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>No reports created yet</h3>
                    <p style={{ color: 'var(--muted)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                        Create your first custom report to track the metrics that matter most to your boardroom.
                    </p>
                    <Link href="/reports/new" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Start Builder &rarr;</Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {reports.map((report) => {
                        const lastRun = report.runs[0];
                        return (
                            <div key={report.id} style={{
                                background: 'var(--surface)', borderRadius: '12px',
                                border: '1px solid var(--border)', padding: '1.5rem',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                display: 'flex', flexDirection: 'column',
                                boxShadow: 'var(--shadow-sm)',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                {/* Card Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ padding: '8px', background: 'var(--surface-2)', borderRadius: '8px', color: 'var(--primary)' }}>
                                        <BarChart3 size={20} />
                                    </div>
                                    {report.isPreset && (
                                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, background: 'var(--surface-2)', padding: '4px 8px', borderRadius: '4px', color: 'var(--muted)' }}>System</span>
                                    )}
                                </div>

                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{report.name}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.5rem', flex: 1, lineHeight: '1.5' }}>
                                    {report.description || "No description provided."}
                                </p>

                                {/* Footer / Meta */}
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} />
                                            <span>
                                                {lastRun ? new Date(lastRun.runAt).toLocaleDateString() : 'Never run'}
                                            </span>
                                        </div>
                                        {lastRun && (
                                            <span style={{
                                                color: lastRun.status === 'success' ? 'var(--success)' : 'var(--danger)',
                                                background: lastRun.status === 'success' ? '#dcfce7' : '#fee2e2',
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
                                            }}>
                                                {lastRun.status}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <Link href={`/reports/run/${report.id}`}
                                            style={{
                                                textAlign: 'center', padding: '0.6rem', borderRadius: '6px',
                                                background: 'var(--surface-2)', color: 'var(--text)',
                                                fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none'
                                            }}
                                        >
                                            View
                                        </Link>
                                        <Link href={`/reports/edit/${report.id}`}
                                            style={{
                                                textAlign: 'center', padding: '0.6rem', borderRadius: '6px',
                                                border: '1px solid var(--border)', color: 'var(--muted)',
                                                fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none'
                                            }}
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
