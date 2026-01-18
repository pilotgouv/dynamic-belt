'use client';

import React from 'react';
import { Shield } from 'lucide-react';

export default function DangerZoneClient() {
    return (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
            <h3 style={{ color: '#991B1B', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} /> Zone de Diagnostic & Réinitialisation
            </h3>
            <p style={{ color: '#B91C1C', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Si vos données semblent bloquées, incomplètes, ou si vous ne voyez pas l'historique complet (avant le 10 Janvier), utilisez cette option pour effacer le cache PILOT et forcer une re-synchronisation profonde.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    onClick={async () => {
                        if (!confirm("ATTENTION: Cette action est irréversible.\n\nElle va effacer tout l'historique importé (Finance, Produits, Ads) de la base de données PILOT.\n\nVos données sources (Shopify/WooCommerce) ne sont PAS affectées.\n\nAprès cette action, vous devrez relancer 'Synchroniser tout'.")) return;

                        try {
                            const res = await fetch('/api/diag/purge', { method: 'POST' });
                            if (res.ok) {
                                alert("Données API Effacés, Relancez \"Synchroniser tout\" pour alimenter Pilot.");
                                window.location.reload();
                            } else {
                                const err = await res.json();
                                alert("Erreur: " + err.error);
                            }
                        } catch (e) {
                            alert("Erreur réseau");
                        }
                    }}
                    style={{
                        background: '#FFFFFF',
                        color: '#DC2626',
                        border: '1px solid #DC2626',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Effacer & Réinitialiser
                </button>

                <button
                    onClick={() => window.open('/api/diag/date-range', '_blank')}
                    style={{
                        background: 'transparent',
                        color: '#4B5563',
                        border: '1px solid #D1D5DB',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                    }}
                >
                    Voir Diagnostic Dates
                </button>

                <button
                    onClick={() => window.open('/api/diag/sync-logs', '_blank')}
                    style={{
                        background: 'transparent',
                        color: '#4B5563',
                        border: '1px solid #D1D5DB',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                    }}
                >
                    Voir Logs Synchro (Tech)
                </button>
            </div>
        </div>
    );
}
