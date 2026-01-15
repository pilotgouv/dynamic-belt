import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Plus, Calendar, ArrowRight, BarChart3, Clock } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

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

    const orgId = (session.user as any).organizationId;
    if (!orgId) return <div style={{ padding: '2rem' }}>Error: No Organization found.</div>;

    const reports = await getReports(orgId);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bibliothèque de Rapports</h1>
                    <p style={{ color: 'var(--muted)' }}>Intelligence prête pour le conseil d'administration.</p>
                </div>
                <Link href="/dashboard/reports/new"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'var(--primary-gradient)', color: 'white',
                        padding: '0.75rem 1.5rem', borderRadius: '8px',
                        fontWeight: 600, textDecoration: 'none',
                        boxShadow: 'var(--shadow-md)', transition: 'transform 0.2s'
                    }}
                >
                    <Plus size={18} />
                    Nouveau Rapport
                </Link>
            </header>

            {/* Content */}
            {reports.length === 0 ? (
                <div className="py-12">
                    <EmptyState
                        title="Vos rapports de direction vivront ici"
                        message="Les rapports transforment les données en direct en insights exécutifs que vous pouvez partager ou revisiter. Créez votre premier rapport pour capturer un instantané de votre performance."
                        actionLabel="Créer un premier rapport"
                        actionUrl="/dashboard/reports/new"
                        secondaryText="Les rapports s'actualisent automatiquement quand les données changent."
                        icon={<FileText size={32} />}
                    />
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
                                    {report.description || "Aucune description fournie."}
                                </p>

                                {/* Footer / Meta */}
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} />
                                            <span>
                                                {lastRun ? new Date(lastRun.runAt).toLocaleDateString() : 'Jamais exécuté'}
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
                                        <Link href={`/dashboard/reports/run/${report.id}`}
                                            style={{
                                                textAlign: 'center', padding: '0.6rem', borderRadius: '6px',
                                                background: 'var(--surface-2)', color: 'var(--text)',
                                                fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none'
                                            }}
                                        >
                                            Voir
                                        </Link>
                                        <Link href={`/dashboard/reports/edit/${report.id}`}
                                            style={{
                                                textAlign: 'center', padding: '0.6rem', borderRadius: '6px',
                                                border: '1px solid var(--border)', color: 'var(--muted)',
                                                fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none'
                                            }}
                                        >
                                            Éditer
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
