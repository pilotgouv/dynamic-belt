
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirm = formData.get('confirm');
        const name = formData.get('name');

        if (password !== confirm) {
            setError("Les mots de passe ne correspondent pas");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Erreur inconnue');
            }

            // Success -> Redirect to Login
            router.push('/login?signup=success');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

            {/* Left Column: Brand (Same as Login) */}
            <div style={{
                background: 'var(--text)',
                color: 'white',
                padding: '4rem',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-20%', right: '-20%', width: '80%', height: '80%',
                    background: 'radial-gradient(circle, rgba(42,124,176,0.4) 0%, rgba(14,14,29,0) 70%)',
                    filter: 'blur(60px)', zIndex: 0
                }} />

                <div style={{ zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4rem' }}>
                        <Image src="/brand/logopilot.png" alt="PILOT" width={32} height={32} />
                        <span style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.05em' }}>PILOT</span>
                    </div>
                </div>

                <div style={{ zIndex: 1, maxWidth: '480px' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Start your journey.
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.6 }}>
                        Create your Pilot account today and gain instant visibility into your business metrics.
                    </p>
                </div>

                <div style={{ zIndex: 1, color: '#475569', fontSize: '0.9rem' }}>
                    © 2024 Pilot Inc. All rights reserved.
                </div>
            </div>

            {/* Right Column: Signup Form */}
            <div style={{
                background: 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '2rem'
            }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>Créer un compte</h1>
                        <p style={{ color: 'var(--muted)' }}>Commencez à piloter votre business.</p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px',
                            background: '#fee2e2', color: '#991b1b', fontSize: '0.9rem', fontWeight: 500,
                            border: '1px solid #fecaca'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Nom complet</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                                <input
                                    name="name" type="text" required placeholder="John Doe"
                                    style={{
                                        width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem',
                                        borderRadius: '8px', border: '1px solid var(--border)',
                                        fontSize: '1rem', color: 'var(--text)', background: 'white',
                                        outline: 'none', transition: 'box-shadow 0.2s, border-color 0.2s'
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(42, 124, 176, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Email professionnel</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                                <input
                                    name="email" type="email" required placeholder="name@company.com"
                                    style={{
                                        width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem',
                                        borderRadius: '8px', border: '1px solid var(--border)',
                                        fontSize: '1rem', color: 'var(--text)', background: 'white',
                                        outline: 'none', transition: 'box-shadow 0.2s, border-color 0.2s'
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(42, 124, 176, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Mot de passe</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                                    <input
                                        name="password" type="password" required placeholder="••••••••" minLength={8}
                                        style={{
                                            width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem',
                                            borderRadius: '8px', border: '1px solid var(--border)',
                                            fontSize: '1rem', color: 'var(--text)', background: 'white',
                                            outline: 'none', transition: 'box-shadow 0.2s, border-color 0.2s'
                                        }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(42, 124, 176, 0.1)'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Confirmer</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                                    <input
                                        name="confirm" type="password" required placeholder="••••••••" minLength={8}
                                        style={{
                                            width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem',
                                            borderRadius: '8px', border: '1px solid var(--border)',
                                            fontSize: '1rem', color: 'var(--text)', background: 'white',
                                            outline: 'none', transition: 'box-shadow 0.2s, border-color 0.2s'
                                        }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(42, 124, 176, 0.1)'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '0.85rem',
                                background: 'var(--text)', color: 'white',
                                border: 'none', borderRadius: '8px',
                                fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                opacity: loading ? 0.7 : 1, transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {loading ? 'Création...' : "S'inscrire"}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
                        Déjà un compte ? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
