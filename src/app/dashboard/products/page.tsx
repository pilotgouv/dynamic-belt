
import ProductsView from '@/components/dashboard-views/ProductsView';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

export default async function ProductsListPage() {
    const session = await auth();
    if (!session || !session.user) redirect('/login');
    const orgId = (session.user as any).organizationId;

    return <ProductsView orgId={orgId} />;
}
