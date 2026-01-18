"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2, Shield, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError('Identifiants incorrects.');
                setLoading(false);
            } else {
                router.push('/dashboard/overview');
            }
        } catch (err) {
            setError('Une erreur est survenue.');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-montserrat">

            {/* --- LEFT SIDE (75%) --- */}
            <div className="hidden lg:flex flex-col justify-between w-3/4 bg-[#EFF4FF] p-16 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                {/* Branding */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                        P
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">PILOT</span>
                </div>

                {/* Main Content */}
                <div className="relative z-10 max-w-2xl space-y-8">
                    <h1 className="text-6xl font-bold text-slate-900 leading-[1.1]">
                        Boardroom-grade <br />
                        <span className="text-blue-600">Business Intelligence</span>
                    </h1>
                    <p className="text-xl text-slate-500 leading-relaxed">
                        Prenez le contrôle de votre croissance avec des données financières auditables, unifiées et précises.
                    </p>

                    <div className="grid grid-cols-2 gap-6 pt-8">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Données Sécurisées</h3>
                                <p className="text-sm text-slate-500 mt-1">Chiffrement bancaire AES-256.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-cyan-100 rounded-lg text-cyan-600">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Accès Personnel</h3>
                                <p className="text-sm text-slate-500 mt-1">Espace privé et confidentiel.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Copyright */}
                <div className="relative z-10 text-sm text-slate-400 font-medium">
                    © 2026 PILOT Data Inc.
                </div>
            </div>

            {/* --- RIGHT SIDE (25%) --- */}
            <div className="w-full lg:w-1/4 bg-white flex flex-col justify-center p-8 lg:p-12 shadow-2xl z-20">

                <div className="max-w-sm mx-auto w-full space-y-8 animate-in slide-in-from-right-8 duration-700">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 mb-6 mx-auto">P</div>
                        <h2 className="text-2xl font-bold text-slate-900">Bon retour</h2>
                        <p className="text-sm text-slate-500 mt-2">Connectez-vous à votre espace.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg flex items-center gap-2 animate-in shake">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="nom@entreprise.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mot de passe</label>
                                <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                                    Oublié ?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Accéder au Boardroom'}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-300 font-medium">Ou continuer avec</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-not-allowed">
                        <button disabled className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 text-sm hover:bg-slate-50">
                            Google
                        </button>
                        <button disabled className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 text-sm hover:bg-slate-50">
                            Apple
                        </button>
                    </div>

                    <div className="text-center pt-4">
                        <p className="text-xs text-slate-400">
                            Pas encore de compte ? <Link href="/signup" className="text-blue-600 font-bold hover:underline">Créer un espace</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
