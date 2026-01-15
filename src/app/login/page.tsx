"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
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
                setError('Identifiants incorrects.');
            } else {
                router.push('/dashboard/overview'); // Redirect to new overview
                router.refresh();
            }
        } catch (err) {
            setError('Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">

            {/* BRANDING */}
            <div className="mb-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-gray-200">
                    <span className="text-white text-2xl font-bold">P</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">Boardroom-grade Business Intelligence</h1>
                <p className="text-gray-500 text-sm">See your real profit. Not just revenue.</p>
            </div>

            {/* CARD */}
            <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                        />
                        <div className="flex justify-end pt-1">
                            <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-black transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Access Boardroom
                    </button>
                </form>
            </div>

            <p className="mt-8 text-xs text-gray-400">
                &copy; 2026 PILOT Data.
            </p>

            <div className="mt-4 opacity-20 hover:opacity-100 transition-opacity">
                <Link href="/api/auth/debug-reset" className="text-[10px] text-red-500">Debug Reset</Link>
            </div>
        </div>
    );
}
