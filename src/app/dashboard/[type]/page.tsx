import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import OverviewView from '@/components/dashboard-views/OverviewView';
import ProductsView from '@/components/dashboard-views/ProductsView';
import FinanceView from '@/components/dashboard-views/FinanceView';
import AdsView from '@/components/dashboard-views/AdsView';
import TrafficView from '@/components/dashboard-views/TrafficView';
import SettingsView from '@/components/dashboard-views/SettingsView';

export const runtime = 'nodejs';

export default async function DashboardPage(props: { params: Promise<{ type: string }> }) {
    const params = await props.params;

    const session = await auth();

    if (!session || !session.user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
                <h1 className="text-2xl font-bold text-red-600">Session Expired</h1>
                <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Login</Link>
            </div>
        )
    }

    const orgId = (session.user as any).organizationId;
    const type = params.type || 'overview';

    if (!orgId) {
        return (
            <div className="p-8 text-center text-red-500">
                <h3 className="font-bold">Erreur de contexte</h3>
                <Link href="/login" className="px-4 py-2 bg-black text-white rounded">Retour</Link>
            </div>
        );
    }

    // 1. Specialized Views (Boardroom V4)
    if (type === 'overview') return <OverviewView orgId={orgId} />;
    if (type === 'products') return <ProductsView orgId={orgId} />;
    if (type === 'finance') return <FinanceView orgId={orgId} />;
    if (type === 'ads') return <AdsView orgId={orgId} />;
    if (type === 'traffic') return <TrafficView orgId={orgId} />;

    if (type === 'settings') {
    const logs = await prisma.syncLog.findMany({
        where: { organizationId: orgId },
        orderBy: { startedAt: 'desc' },
        take: 20
    });
    // We cast logs to any to avoid strict type checks on Date vs string serialization
    return <SettingsView orgId={orgId} logs={JSON.parse(JSON.stringify(logs))} />;
}
if (type === 'connections') return <div className="p-8">Connections View (TODO)</div>; // Fallback for connections if view missing

// 2. Default Fallback
return <OverviewView orgId={orgId} />;
}
