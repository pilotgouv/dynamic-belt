
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.2rem', color: 'var(--text)' }}>Créer un compte</h1>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Rejoignez PILOT pour piloter votre business.</p>
                </div>

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
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>Nom complet</label>
                        <input name="name" type="text" required
                            style={{
                                width: '100%', padding: '0.75rem',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px', color: 'var(--text)',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>Email pro</label>
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

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>Mot de passe</label>
                        <input name="password" type="password" required minLength={8}
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
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>Confirmer</label>
                        <input name="confirm" type="password" required minLength={8}
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
                        {loading ? 'Création...' : "S'inscrire"}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Déjà un compte ? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
                </div>
            </div>
        </div>
    );
}
