
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // We will auto-login by redirecting to login page with filled email for now 
    // or we can invoke signIn client side. simpler to redirect to login.

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
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Créer un compte</h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Rejoignez PILOT pour piloter votre business.</p>
                </div>

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
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#ccc' }}>Nom complet</label>
                        <input name="name" type="text" required
                            style={{
                                width: '100%', padding: '0.75rem', background: '#000', border: '1px solid #333',
                                borderRadius: '6px', color: '#fff'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#ccc' }}>Email pro</label>
                        <input name="email" type="email" required
                            style={{
                                width: '100%', padding: '0.75rem', background: '#000', border: '1px solid #333',
                                borderRadius: '6px', color: '#fff'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#ccc' }}>Mot de passe</label>
                        <input name="password" type="password" required minLength={8}
                            style={{
                                width: '100%', padding: '0.75rem', background: '#000', border: '1px solid #333',
                                borderRadius: '6px', color: '#fff'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#ccc' }}>Confirmer</label>
                        <input name="confirm" type="password" required minLength={8}
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
                        {loading ? 'Création...' : "S'inscrire"}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
                    Déjà un compte ? <Link href="/login" style={{ color: '#D4AF37', textDecoration: 'none' }}>Se connecter</Link>
                </div>
            </div>
        </div>
    );
}
