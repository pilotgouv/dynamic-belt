
"use client";

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
            background: '#050505',
            color: '#fff'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px'
            }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <div style={{ width: 12, height: 12, background: '#D4AF37', borderRadius: '50%', margin: '0 auto 1rem' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Connexion PILOT</h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Accédez à votre cockpit.</p>
                </div>

                {created && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        background: 'rgba(74, 222, 128, 0.1)',
                        border: '1px solid rgba(74, 222, 128, 0.2)',
                        color: '#4ade80',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                    }}>
                        Compte créé avec succès. Connectez-vous.
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#ccc' }}>Email</label>
                        <input name="email" type="email" required
                            style={{
                                width: '100%', padding: '0.75rem', background: '#000', border: '1px solid #333',
                                borderRadius: '6px', color: '#fff'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#ccc' }}>Mot de passe</label>
                        <input name="password" type="password" required
                            style={{
                                width: '100%', padding: '0.75rem', background: '#000', border: '1px solid #333',
                                borderRadius: '6px', color: '#fff'
                            }}
                        />
                    </div>

                    <button type="submit" disabled={loading}
                        style={{
                            width: '100%', padding: '0.75rem', background: '#D4AF37', border: 'none',
                            borderRadius: '6px', color: '#000', fontWeight: 600, cursor: 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Connexion...' : "Se connecter"}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
                    Pas encore de compte ? <Link href="/signup" style={{ color: '#D4AF37', textDecoration: 'none' }}>Créer un compte</Link>
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
