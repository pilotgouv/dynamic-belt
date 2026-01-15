"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirm = formData.get('confirm');
        const name = formData.get('name');

        if (password !== confirm) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Unknown error');
            }

            // Success -> Redirect to Login
            router.push('/login?signup=success');

        } catch (err: any) {
            setError(err.message);
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
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">Create your account</h1>
                <p className="text-gray-500 text-sm">Join founders piloting with precision.</p>
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
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                        <div className="relative group">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                name="name"
                                type="text"
                                required
                                placeholder="John Doe"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm font-medium outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Work Email</label>
                        <div className="relative group">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="name@company.com"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm font-medium outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative group">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                minLength={8}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm font-medium outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Confirm Password</label>
                        <div className="relative group">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                name="confirm"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm font-medium outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : (
                            <>
                                Create Account <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-black font-semibold hover:underline">
                    Log in
                </Link>
            </div>
        </div>
    );
}
