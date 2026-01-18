import TrafficView from '@/components/dashboard-views/TrafficView';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const metadata = {
    title: 'Trafic & Attribution | PILOT',
};

export default async function Page() {
    const session = await auth();
    if (!session) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { email: session.user?.email! },
        include: { memberships: true }
    });

    if (!user || user.memberships.length === 0) redirect('/onboarding');
    const orgId = user.memberships[0].organizationId;

    return <TrafficView orgId={orgId} />;
}
