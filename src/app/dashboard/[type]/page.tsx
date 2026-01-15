import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ReportRunnerView from '../../reports/run/[id]/ReportRunnerView';

export const runtime = 'nodejs';

// Predefined Definitions for "Standard" Dashboards
const DASHBOARD_PRESETS: any = {
    overview: {
        name: "Executive Overview",
        config: {
            metrics: ["revenue", "profit", "spend", "margin"],
            dimensions: ["date"],
            range: { start: null, end: null, period: 'last_30_days' } // dynamic handling in client
        }
    },
    finance: {
        name: "Financial Performance",
        config: {
            metrics: ["revenue_gross", "revenue_net", "refunds", "cogs", "fees"],
            dimensions: ["date"],
            range: { start: null, end: null, period: 'last_30_days' }
        }
    },
    ads: {
        name: "Ad Spend & ROAS",
        config: {
            metrics: ["spend", "impressions", "clicks", "roas", "cpa"],
            dimensions: ["channel", "date"],
            range: { start: null, end: null, period: 'last_30_days' }
        }
    },
    traffic: {
        name: "Traffic & Conversion Analysis",
        config: {
            metrics: ["sessions", "users", "conversion_rate", "revenue_per_session"],
            dimensions: ["source", "medium"],
            range: { start: null, end: null, period: 'last_30_days' }
        }
    },
    products: {
        name: "Product Performance",
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
