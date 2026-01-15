import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ReportRunnerView from './ReportRunnerView';

export const runtime = 'nodejs';

async function getReportDefinition(reportId: string, orgId: string) {
    return await prisma.reportDefinition.findUnique({
        where: { id: reportId, organizationId: orgId }
    });
}

export default async function ReportRunPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const orgId = (session.user as any).organizationId;
    const report = await getReportDefinition(params.id, orgId);

    if (!report) return <div style={{ padding: '2rem' }}>Report not found or access denied.</div>;

    return (
        <ReportRunnerView report={report} orgId={orgId} />
    );
}
