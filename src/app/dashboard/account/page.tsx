
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { LogOut, CreditCard, Shield, Activity, HardDrive, Smartphone, CheckCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import DangerZoneClient from '@/components/account/DangerZoneClient';

export const runtime = 'nodejs';

async function getAccountData(userId: string, orgId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, createdAt: true, plan: true }
    });

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, plan: true, createdAt: true }
    });

    const connectionsCount = await prisma.connection.count({ where: { organizationId: orgId } });

    return { user, org, connectionsCount };
}

export default async function AccountPage() {
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const userId = session.user.id as string;
    const orgId = (session.user as any).organizationId as string;

    const { user, org, connectionsCount } = await getAccountData(userId, orgId);

    if (!user || !org) return <div>Error loading account.</div>;

    const isPremium = true; // Force visual premium for everyone as requested "multi-connexion pour tout le monde"

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '4rem 2rem',
            fontFamily: 'var(--font-sans)',
            color: '#1e293b'
        }}>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* ID CARD HEADER */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-white/50 mb-8 relative">
                    <div className="h-32 bg-gradient-to-r from-indigo-600 to-blue-600"></div>
                    <div className="px-8 pb-8 relative">
                        <div className="absolute -top-16 left-8 p-1 bg-white rounded-2xl shadow-lg">
                            <div className="w-32 h-32 bg-indigo-100 rounded-xl flex items-center justify-center text-4xl font-bold text-indigo-600">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
                            </div>
                        </div>

                        <div className="ml-44 pt-4 flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                                <div className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                                    <Shield size={16} className="text-indigo-500" />
                                    {org.name}
                                </div>
                            </div>
                            <div className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg glow">
                                <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                                Pilote Certifié
                            </div>
                        </div>

                        <div className="mt-8 flex gap-8 border-t border-gray-100 pt-8">
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Email</div>
                                <div className="font-medium text-gray-900">{user.email}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Plan</div>
                                <div className="font-medium text-indigo-600 font-bold">Unlimited Access</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Membre depuis</div>
                                <div className="font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* STATUS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Connection Status */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 rounded-xl text-green-600">
                                <Activity size={24} />
                            </div>
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">ACTIF</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Connexions</h3>
                        <p className="text-gray-500 text-sm mb-4">Sources de données synchronisées</p>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-gray-900">{connectionsCount}</span>
                            <span className="text-sm text-gray-400 mb-1 font-medium">/ Illimité</span>
                        </div>
                        <div className="mt-3 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-full animate-pulse"></div>
                        </div>
                    </div>

                    {/* Security Status */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <Shield size={24} />
                            </div>
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">SÉCURISÉ</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Sécurité</h3>
                        <p className="text-gray-500 text-sm mb-4">Compte et données chiffrées</p>

                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle size={16} className="text-green-500" /> Mot de passe fort
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle size={16} className="text-green-500" /> Chiffrement AES-256
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Abonnement</h4>
                                <p className="text-xs text-gray-500">Gérer la facturation et les plans</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:border-black transition-colors">Gérer</button>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                        <Link href="/api/auth/signout" className="flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
                                    <LogOut size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">Déconnexion</h4>
                                    <p className="text-xs text-gray-500">Se déconnecter de cette session</p>
                                </div>
                            </div>
                            <span className="text-gray-400">→</span>
                        </Link>
                    </div>
                </div>

                <div className="mt-8">
                    <DangerZoneClient />
                </div>

            </div>
        </div >
    );
}
