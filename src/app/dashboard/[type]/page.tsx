import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import OverviewView from '@/components/dashboard-views/OverviewView';
import ProductsView from '@/components/dashboard-views/ProductsView';
import FinanceView from '@/components/dashboard-views/FinanceView';
import AdsView from '@/components/dashboard-views/AdsView';
import TrafficView from '@/components/dashboard-views/TrafficView';

export const runtime = 'nodejs';

export default async function DashboardPage(props: { params: Promise<{ type: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const orgId = (session.user as any).organizationId;
    const type = params.type || 'overview';

    // 1. Specialized Views (Boardroom V4)
    if (type === 'overview') return <OverviewView orgId={orgId} />;
    if (type === 'products') return <ProductsView orgId={orgId} />;
    if (type === 'finance') return <FinanceView orgId={orgId} />;
    if (type === 'ads') return <AdsView orgId={orgId} />;
    if (type === 'traffic') return <TrafficView orgId={orgId} />;

    // 2. Default Fallback
    return <OverviewView orgId={orgId} />;
}
