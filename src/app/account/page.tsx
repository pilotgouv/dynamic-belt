
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccountPage() {
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const user = session.user as any; // Cast to access custom fields

    // Limits logic
    const PLAN_LIMITS = {
        free: { reports: 1, connections: 1 },
        premium: { reports: 999, connections: 999 }
    };

    const myPlan = (user.plan as 'free' | 'premium') || 'free';
    const limit = PLAN_LIMITS[myPlan] || PLAN_LIMITS.free;

    // Fetch actual usage
    const orgId = user.organizationId;
    let reportCount = 0;
    let connectionCount = 0;

    if (orgId) {
        reportCount = await prisma.reportDefinition.count({
            where: { organizationId: orgId }
        });
        // Count connections
        // Count connections - assume limit applies to ACTIVE connections only? 
        // Or all except disabled? Let's say all NOT DISABLED for now.
        connectionCount = await prisma.connection.count({
            where: { organizationId: orgId, status: { not: 'DISABLED' } }
        });
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', width: '100%', color: '#fff' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #222', paddingBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Mon Compte</h1>
                <p style={{ color: '#888' }}>Cockpit personnel & Abonnements</p>
            </header>

            <div style={{ display: 'grid', gap: '2rem' }}>

                {/* Profile Card */}
                <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Profil</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', color: '#666', fontSize: '0.8rem', marginBottom: '0.2rem' }}>NOM</label>
                            <div style={{ fontSize: '1rem' }}>{user.name || 'Pilote'}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#666', fontSize: '0.8rem', marginBottom: '0.2rem' }}>EMAIL</label>
                            <div style={{ fontSize: '1rem' }}>{user.email}</div>
                        </div>
                    </div>
                </div>

                {/* Plan & Usage Card */}
                <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Plan & Usage</h2>
                        <div style={{
                            background: myPlan === 'premium' ? 'linear-gradient(45deg, #D4AF37, #F9D976)' : '#333',
                            color: myPlan === 'premium' ? '#000' : '#fff',
                            padding: '0.3rem 0.8rem', borderRadius: '100px',
                            fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase'
                        }}>
                            {myPlan}
                        </div>
                    </div>

                    {myPlan === 'free' && (
                        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#222', borderRadius: '6px', borderLeft: '3px solid #D4AF37' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
                                Vous êtes sur le plan <strong>Gratuit</strong>. Passez à la vitesse supérieure.
                            </p>
                            <Link href="/pricing" style={{
                                display: 'inline-block', marginTop: '0.8rem',
                                color: '#D4AF37', fontWeight: 600, textDecoration: 'none'
                            }}>
                                Voir les offres Premium →
                            </Link>
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ color: '#ccc' }}>Connexions actives</span>
                                <span>{connectionCount} / {myPlan === 'premium' ? '∞' : limit.connections}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px' }}>
                                <div style={{
                                    width: `${Math.min(100, (connectionCount / limit.connections) * 100)}%`,
                                    height: '100%', background: '#D4AF37', borderRadius: '3px'
                                }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ color: '#ccc' }}>Rapports sauvegardés</span>
                                <span>{reportCount} / {myPlan === 'premium' ? '∞' : limit.reports}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px' }}>
                                <div style={{
                                    width: `${Math.min(100, (reportCount / limit.reports) * 100)}%`,
                                    height: '100%', background: '#D4AF37', borderRadius: '3px'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Version 2.6.0</div>
                    {/* Logout handled by sidebar usually, but can add here if requested */}
                </div>

            </div>
        </div>
    );
}
