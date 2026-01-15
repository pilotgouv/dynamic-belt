'use client';

import React, { useEffect, useState } from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Compass } from 'lucide-react';

interface TrafficViewProps {
    orgId: string;
}

export default function TrafficView({ orgId }: TrafficViewProps) {
    const { range } = useDateRange();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            setLoading(true);
            try {
                const response = await fetch('/api/reports/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        organizationId: orgId,
                        config: {
                            metrics: ["sessions", "users", "conversion_rate", "revenue_per_session"],
                            dimensions: ["date"],
                        },
                        range: range
                    })
                });
                const result = await response.json();
                if (isMounted) setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        if (orgId && range) fetchData();
        return () => { isMounted = false; };
    }, [orgId, range]);

    const formatPercent = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 2 }).format(val / 100);

    const summary = data?.summary || {};
    const chartData = data?.series || [];

    // Empty State Check
    if (!loading && chartData.length === 0) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <EmptyState
                    title="Intelligence trafic indisponible"
                    message="PILOT analyse la qualité du trafic, la santé du tunnel et l'efficacité de conversion. Connectez votre source d'analyse pour détecter les fuites, le tracking cassé ou les canaux sous-performants."
                    actionLabel="Connecter l'analyse"
                    actionUrl="/dashboard/connections"
                    secondaryText="GA4 recommandé pour un diagnostic complet du tunnel."
                    icon={<Compass size={32} />}
                />
            </div>
        );
    }

    // Basic Render Phase 1
    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-4">
                <KPICard title="Sessions" value={summary.sessions ? summary.sessions.toLocaleString() : '-'} loading={loading} />
                <KPICard title="Utilisateurs" value={summary.users ? summary.users.toLocaleString() : '-'} loading={loading} />
                <KPICard title="Taux de Conversion" value={summary.conversion_rate ? summary.conversion_rate.toFixed(2) : '-'} suffix="%" loading={loading} />
                <KPICard title="Rev / Session" value={summary.revenue_per_session ? summary.revenue_per_session.toFixed(2) : '-'} suffix="€" loading={loading} />
            </div>

            {/* Placeholder for Deep Table */}
            <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                <div className="mx-auto w-12 h-12 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center mb-4">
                    <Compass size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Analyse Sources & Tunnel</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    L'analyse détaillée par source/medium est en cours de construction (Phase 2).
                </p>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wide">Disponible Phase 2</div>
            </div>
        </div>
    );
}
