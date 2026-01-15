import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ReportRunnerView from '../../reports/run/[id]/ReportRunnerView';

export const runtime = 'nodejs';

// Predefined Definitions for "Standard" Dashboards
const DASHBOARD_PRESETS: any = {
    overview: {
        name: "Vue Exécutive (Vue d'ensemble)",
        config: {
            metrics: ["revenue", "profit", "spend", "margin"],
            dimensions: ["date"],
            range: { start: null, end: null, period: 'last_30_days' } // dynamic handling in client
        }
    },
    finance: {
        name: "Performance Financière",
        config: {
            metrics: ["revenue_gross", "revenue_net", "refunds", "cogs", "fees"],
            dimensions: ["date"],
            range: { start: null, end: null, period: 'last_30_days' }
        }
    },
    ads: {
        name: "Dépenses & ROAS (Ads)",
        config: {
            metrics: ["spend", "impressions", "clicks", "roas", "cpa"],
            dimensions: ["channel", "date"],
            range: { start: null, end: null, period: 'last_30_days' }
        }
    },
    traffic: {
        name: "Trafic & Conversion",
        config: {
            metrics: ["sessions", "users", "conversion_rate", "revenue_per_session"],
            dimensions: ["source", "medium"],
            range: { start: null, end: null, period: 'last_30_days' }
        }
    },
    products: {
        name: "Intelligence Produits",
        config: {
            metrics: ["units_sold", "revenue"],
            dimensions: ["product_name"],
            range: { start: null, end: null, period: 'last_30_days' }
        }
    }
};

export default async function DashboardPage(props: { params: Promise<{ type: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const orgId = (session.user as any).organizationId;
    const type = params.type || 'overview';

    // Fallback to overview if invalid type
    const preset = DASHBOARD_PRESETS[type] || DASHBOARD_PRESETS.overview;

    // Construct a "Virtual" Report object
    const virtualReport = {
        id: null, // Ephemeral
        name: preset.name,
        config: preset.config,
        organizationId: orgId
    };

    return (
        <ReportRunnerView report={virtualReport} orgId={orgId} />
    );
}
