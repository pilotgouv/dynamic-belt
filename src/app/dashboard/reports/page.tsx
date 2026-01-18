import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, LayoutGrid, FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import ReportCard from '@/components/ReportCard';

export const runtime = 'nodejs';

async function getReports(orgId: string) {
    return await prisma.reportDefinition.findMany({
        where: { organizationId: orgId },
        orderBy: { updatedAt: 'desc' },
        include: {
            runs: {
                take: 1,
                orderBy: { runAt: 'desc' },
                select: { status: true, runAt: true }
            }
        }
    });
}

export default async function ReportsPage() {
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const orgId = (session.user as any).organizationId;
    if (!orgId) return <div className="p-8 text-red-500">Error: No Organization found.</div>;

    const reports = await getReports(orgId);

    return (
        <div className="max-w-[1400px] mx-auto p-8 font-sans text-gray-900 pb-32">

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-in slide-in-from-top-4 duration-500">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Bibliothèque</h1>
                    <p className="text-gray-500 mt-2 font-medium">Vos rapports exécutifs et analyses sauvegardées.</p>
                </div>
                <Link
                    href="/dashboard/reports/new"
                    className="group bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-gray-200 hover:shadow-2xl transition-all flex items-center gap-2"
                >
                    <div className="bg-white/20 p-1 rounded-md group-hover:scale-110 transition-transform">
                        <Plus size={16} strokeWidth={3} />
                    </div>
                    Nouveau Rapport
                </Link>
            </header>

            {/* Content */}
            {reports.length === 0 ? (
                <div className="py-12 animate-in fade-in duration-700">
                    <EmptyState
                        title="Votre Boardroom est vide"
                        message="Créez votre premier rapport pour transformer vos données brutes en intelligence stratégique actionnable."
                        actionLabel="Créer un rapport maintenant"
                        actionUrl="/dashboard/reports/new"
                        secondaryText="Templates disponibles : P&L, Unit Economics, Ad Performance..."
                        icon={<LayoutGrid size={48} className="text-gray-300" />}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {reports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                    ))}
                </div>
            )}
        </div>
    );
}
