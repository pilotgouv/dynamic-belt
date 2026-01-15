import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { LogOut, CreditCard, Shield, Activity, HardDrive, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export const runtime = 'nodejs';

async function getAccountData(userId: string, orgId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, createdAt: true, plan: true }
    });

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, plan: true, createdAt: true }
    });

    // Usage Counts
    const reportsCount = await prisma.reportDefinition.count({ where: { organizationId: orgId } });
    const connectionsCount = await prisma.connection.count({ where: { organizationId: orgId } });

    return { user, org, usage: { reports: reportsCount, connections: connectionsCount } };
}

export default async function AccountPage() {
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const userId = session.user.id as string;
    const orgId = (session.user as any).organizationId as string;

    const { user, org, usage } = await getAccountData(userId, orgId);

    if (!user || !org) return <div>Error loading account.</div>;

    const isPremium = user.plan === 'premium' || org.plan === 'premium';

    // Limits (Hardcoded based on plan for now, could be in DB)
    const LIMITS = {
        free: { reports: 1, connections: 1 },
        premium: { reports: 100, connections: 20 }
    };
    const currentLimits = isPremium ? LIMITS.premium : LIMITS.free;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)', // Should be white/light per spec
            padding: '4rem 2rem',
            fontFamily: 'var(--font-sans)',
            color: 'var(--text)'
        }}>

            <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <Image
                        src="/brand/logopilot.png"
                        alt="PILOT"
                        width={64}
                        height={64}
                        style={{ marginBottom: '1.5rem', borderRadius: '12px' }} // Optional slight rounding
                    />
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Personal Account</h1>
                    <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>Manage your profile and subscription.</p>
                </div>

                {/* Section: Profile */}
                <section style={sectionStyle}>
                    <h2 style={sectionHeaderStyle}>Profile</h2>

                    <div style={rowStyle}>
                        <div style={labelStyle}>Full Name</div>
                        <div style={valueStyle}>{user.name || 'No name set'}</div>
                    </div>
                    <div style={dividerStyle} />

                    <div style={rowStyle}>
                        <div style={labelStyle}>Email Address</div>
                        <div style={valueStyle}>{user.email}</div>
                    </div>
                    <div style={dividerStyle} />

                    <div style={rowStyle}>
                        <div style={labelStyle}>Organization</div>
                        <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} />
                            {org.name}
                        </div>
                    </div>
                </section>

                {/* Section: Subscription */}
                <section style={sectionStyle}>
                    <div style={{ ...sectionHeaderStyle, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subscription</span>
                        <span style={{
                            fontSize: '0.8rem', fontWeight: 600,
                            padding: '4px 12px', borderRadius: '20px',
                            background: isPremium ? 'var(--text)' : '#f1f5f9',
                            color: isPremium ? 'white' : '#64748b'
                        }}>
                            {isPremium ? 'PREMIUM' : 'FREE PLAN'}
                        </span>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                                <span>Active Reports</span>
                                <span style={{ color: 'var(--muted)' }}>{usage.reports} / {currentLimits.reports}</span>
                            </div>
                            <div style={progressBg}>
                                <div style={{ ...progressBar, width: `${Math.min((usage.reports / currentLimits.reports) * 100, 100)}%` }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                                <span>Data Connections</span>
                                <span style={{ color: 'var(--muted)' }}>{usage.connections} / {currentLimits.connections}</span>
                            </div>
                            <div style={progressBg}>
                                <div style={{ ...progressBar, width: `${Math.min((usage.connections / currentLimits.connections) * 100, 100)}%` }} />
                            </div>
                        </div>

                        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                            {isPremium ? (
                                <button style={secondaryButtonStyle}>Manage Subscription</button>
                            ) : (
                                <button style={primaryButtonStyle}>Upgrade to Premium</button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Section: Security */}
                <section style={sectionStyle}>
                    <h2 style={sectionHeaderStyle}>Security</h2>

                    <div style={rowStyle}>
                        <div style={labelStyle}>Password</div>
                        <div style={{ ...valueStyle, color: 'var(--muted)', fontSize: '0.9rem' }}>••••••••••••</div>
                        <button style={linkButtonStyle}>Update</button>
                    </div>
                    <div style={dividerStyle} />

                    <div style={rowStyle}>
                        <div style={labelStyle}>Session</div>
                        <form action={async () => {
                            "use server"
                            // SignOut logic usually imported from auth/react or handled via route
                            // For simplicity in this V2, we link to signout
                        }}>
                            <Link href="/api/auth/signout" style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                color: 'var(--danger)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem'
                            }}>
                                <LogOut size={16} /> Sign Out
                            </Link>
                        </form>
                    </div>
                </section>

                {/* Section: Technical (Collapsible-ish feel) */}
                <section style={{ ...sectionStyle, border: 'none', background: 'transparent', boxShadow: 'none' }}>
                    <details style={{ cursor: 'pointer' }}>
                        <summary style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500, listStyle: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HardDrive size={14} /> Technical Details
                        </summary>
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span>User ID:</span> <code style={{ fontFamily: 'monospace' }}>{user.id}</code>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span>Org ID:</span> <code style={{ fontFamily: 'monospace' }}>{org.id}</code>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem' }}>
                                <span>Joined:</span> <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </details>
                </section>

            </div>
        </div>
    );
}

// Styles (Inline for now to match strict requirements without new CSS files)
const sectionStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    marginBottom: '2rem',
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
};

const sectionHeaderStyle: React.CSSProperties = {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--border)',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text)',
    backgroundColor: '#fff' // Ensure contrasting header
};

const rowStyle: React.CSSProperties = {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const dividerStyle: React.CSSProperties = {
    height: '1px',
    background: 'var(--border)',
    margin: '0 1.5rem'
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    fontWeight: 500,
    color: 'var(--text)'
};

const valueStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    color: 'var(--muted)',
    fontWeight: 400
};

const progressBg: React.CSSProperties = {
    height: '6px',
    background: '#f1f5f9',
    borderRadius: '3px',
    overflow: 'hidden'
};

const progressBar: React.CSSProperties = {
    height: '100%',
    background: 'var(--primary)', // 'var(--primary-gradient)' might be too much for a thin bar
    borderRadius: '3px'
};

const primaryButtonStyle: React.CSSProperties = {
    background: 'var(--primary-gradient)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-md)'
};

const secondaryButtonStyle: React.CSSProperties = {
    background: 'var(--surface-2)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer'
};

const linkButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem'
};
