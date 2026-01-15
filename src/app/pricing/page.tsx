"use client";

import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
    return (
        <div style={{ padding: '4rem 2rem', color: '#fff', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>

            <div style={{ marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    PILOT Premium
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#888', maxWidth: '600px', margin: '0 auto' }}>
                    Débloquez la clarté "Boardroom-grade" pour vos décisions stratégiques.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* FREE */}
                <div style={{
                    background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '2rem',
                    textAlign: 'left', display: 'flex', flexDirection: 'column'
                }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gratuit</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>0€ <span style={{ fontSize: '1rem', fontWeight: 400, color: '#666' }}>/mois</span></div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #222', color: '#ccc' }}>✅ 1 Connexion (Shopify ou Ads)</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #222', color: '#ccc' }}>✅ 1 Rapport sauvegardé</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #222', color: '#ccc' }}>✅ Dashboard Financier (30j)</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #222', color: '#666' }}>❌ Alertes Intelligentes</li>
                        <li style={{ padding: '0.5rem 0', color: '#666' }}>❌ Mode Boardroom</li>
                    </ul>

                    <Link href="/account" style={{
                        display: 'block', textAlign: 'center', padding: '0.8rem', borderRadius: '6px',
                        background: '#222', color: '#fff', textDecoration: 'none', fontWeight: 600
                    }}>
                        Votre plan actuel
                    </Link>
                </div>

                {/* PREMIUM */}
                <div style={{
                    background: '#111', border: '1px solid #D4AF37', borderRadius: '12px', padding: '2rem',
                    textAlign: 'left', display: 'flex', flexDirection: 'column',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute', top: -12, right: 20, background: '#D4AF37', color: '#000',
                        padding: '0.2rem 0.8rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700
                    }}>
                        RECOMMANDÉ
                    </div>

                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#D4AF37' }}>Premium</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>49€ <span style={{ fontSize: '1rem', fontWeight: 400, color: '#666' }}>/mois</span></div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #333', color: '#fff' }}>✅ Connexions illimitées</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #333', color: '#fff' }}>✅ Rapports illimités + Historique</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #333', color: '#fff' }}>✅ AI Brief Quotidien</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #333', color: '#fff' }}>✅ Alertes Slack/Email</li>
                        <li style={{ padding: '0.5rem 0', color: '#fff' }}>✅ Export PDF Luxe</li>
                    </ul>

                    <button
                        onClick={() => alert("Paiement Stripe bientôt disponible. Contactez support@pilot.gov pour upgrade manuel.")}
                        style={{
                            display: 'block', width: '100%', textAlign: 'center', padding: '0.8rem', borderRadius: '6px',
                            background: '#D4AF37', color: '#000', border: 'none',
                            textDecoration: 'none', fontWeight: 700, cursor: 'pointer'
                        }}>
                        Passer Premium
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                        Sans engagement. Annulable à tout moment.
                    </div>
                </div>

            </div>
        </div>
    );
}
