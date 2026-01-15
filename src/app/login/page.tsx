"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, Loader2, AlertCircle, Fingerprint } from 'lucide-react';
import Image from 'next/image';

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
                setError('Identifiants incorrects. Veuillez réessayer.');
            } else {
                router.push('/reports');
                router.refresh();
            }
        } catch (err) {
            setError('Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-black font-sans text-white overflow-hidden">

            {/* LEFT: BRAND & ART */}
            <div className="flex-1 hidden lg:flex flex-col justify-between p-12 relative bg-[#0a0a0a]">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 to-transparent"></div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                            <span className="text-black font-bold text-xl">P</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight">PILOT</span>
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h2 className="text-5xl font-bold leading-tight mb-6 tracking-tight">La vérité économique <br /><span className="text-blue-500">sans filtre.</span></h2>
                    <p className="text-lg text-gray-400 leading-relaxed">
                        Rejoignez les entrepreneurs qui pilotent leur business avec précision chirurgicale. Fini les vanity metrics, place au Profit Réel.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-sm text-gray-500">
                    <span>© 2026 PILOT Data</span>
                    <span>•</span>
                    <span>Sécurité Bancaire</span>
                    <span>•</span>
                    <span>Chiffré de bout en bout</span>
                </div>
            </div>

            {/* RIGHT: FORM */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white text-black lg:max-w-xl w-full">
                <div className="w-full max-w-sm">

                    <div className="mb-10">
                        <h1 className="text-3xl font-bold mb-2 tracking-tight">Connexion</h1>
                        <p className="text-gray-500">Accédez à votre Boardroom.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-gray-700">Mot de passe</label>
                                <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-black hover:bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    Se connecter <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            Pas encore de compte ?{' '}
                            <Link href="/signup" className="text-black font-bold hover:underline">
                                Créer un compte
                            </Link>
                        </p>
                    </div>

                    {/* DEBUG LINK - To be removed in Prod */}
                    <div className="mt-12 text-center opacity-20 hover:opacity-100 transition-opacity">
                        <a href="/api/auth/debug-reset" target="_blank" className="text-xs text-red-500">Reset Password (Debug)</a>
                    </div>

                </div>
            </div>
        </div>
    );
}
