import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ReportBuilder from '../builder/ReportBuilder';

export const runtime = 'nodejs';

export default async function NewReportPage() {
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const orgId = (session.user as any).organizationId;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '2rem' }}>Nouveau rapport</h1>

            {/* We pass the authentic orgId to the client component */}
            <ReportBuilder organizationId={orgId} />
        </div>
    );
}
