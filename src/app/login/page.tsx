
"use client";

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Show success message if coming from signup
    const created = searchParams.get('signup') === 'success';

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Email ou mot de passe incorrect.");
                setLoading(false);
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError("Erreur de connexion.");
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            color: 'var(--text)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Image src="/brand/logopilot.png" alt="PILOT" width={48} height={48} style={{ marginBottom: '1rem' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.2rem', color: 'var(--text)' }}>PILOT</h1>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Boardroom-grade Business Intelligence</p>
                </div>

                {created && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        background: 'rgba(22, 163, 74, 0.1)',
                        border: '1px solid var(--success)',
                        color: 'var(--success)',
                        borderRadius: '6px',
                        fontSize: '0.85rem', fontWeight: 500
                    }}>
                        Welcome Aboard. Compte créé avec succès.
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        background: 'rgba(220, 38, 38, 0.1)',
                        border: '1px solid var(--danger)',
                        color: 'var(--danger)',
                        borderRadius: '6px',
                        fontSize: '0.85rem', fontWeight: 500
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>Email</label>
                        <input name="email" type="email" required
                            style={{
                                width: '100%', padding: '0.75rem',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px', color: 'var(--text)',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>Mot de passe</label>
                        <input name="password" type="password" required
                            style={{
                                width: '100%', padding: '0.75rem',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px', color: 'var(--text)',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <button type="submit" disabled={loading}
                        style={{
                            width: '100%', padding: '0.75rem',
                            background: 'var(--primary-gradient)',
                            border: 'none',
                            borderRadius: '8px', color: '#fff',
                            fontWeight: 600, cursor: 'pointer',
                            opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        {loading ? 'Connexion...' : "Se connecter"}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Pas encore de compte ? <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Créer un compte</Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <LoginForm />
        </Suspense>
    );
}
