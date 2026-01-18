"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Building2, Calendar, Phone } from 'lucide-react';

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
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const name = `${firstName} ${lastName}`;

        if (password !== confirm) {
            setError("Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }

        try {
            // Note: In a real implementation with backend changes, we would send organization, dob, phone etc.
            // For now, adhering to UI-Only instructions, we send what the current auth API expects.
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Erreur inconnue');
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
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-montserrat">

            <div className="w-full max-w-2xl">
                {/* BRANDING */}
                <div className="mb-10 text-center space-y-4">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                            P
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900">PILOT</span>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Créez votre espace personnel</h1>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Cet espace est <span className="text-slate-900 font-medium">personnel et sécurisé</span>. Il vous appartient et centralise toutes vos données business.
                    </p>
                </div>

                {/* CARD */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-10">

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-center gap-3 animate-in fade-in">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* STEP 1: IDENTITY */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 inline-block px-2 py-1 rounded">Identité</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Prénom"
                                        name="firstName"
                                        type="text"
                                        placeholder="Thomas"
                                        icon={<User size={16} />}
                                    />
                                    <FormInput
                                        label="Nom"
                                        name="lastName"
                                        type="text"
                                        placeholder="Anderson"
                                        icon={<User size={16} />}
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Date de naissance"
                                        name="dob"
                                        type="text"
                                        placeholder="DD/MM/YYYY"
                                        icon={<Calendar size={16} />}
                                    />
                                    <FormInput
                                        label="Téléphone"
                                        name="phone"
                                        type="tel"
                                        placeholder="+33 6 00 00 00 00"
                                        icon={<Phone size={16} />}
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* STEP 2: PROFESSIONAL */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 inline-block px-2 py-1 rounded">Professionnel</h3>

                                <FormInput
                                    label="Organisation / Société"
                                    name="organization"
                                    type="text"
                                    placeholder="Acme Corp"
                                    icon={<Building2 size={16} />}
                                />

                                <FormInput
                                    label="Email Professionnel"
                                    name="email"
                                    type="email"
                                    placeholder="thomas@acme.corp"
                                    icon={<Mail size={16} />}
                                />

                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Mot de passe"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        icon={<Lock size={16} />}
                                    />
                                    <FormInput
                                        label="Confirmation"
                                        name="confirm"
                                        type="password"
                                        placeholder="••••••••"
                                        icon={<Lock size={16} />}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.99] flex justify-center items-center gap-3 text-base"
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : (
                                    <>
                                        Créer mon espace personnel <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-slate-400 mt-4">
                                En créant un compte, vous acceptez nos <a href="#" className="underline hover:text-slate-600">CGU</a> et notre <a href="#" className="underline hover:text-slate-600">Politique de confidentialité</a>.
                            </p>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 font-medium">
                        Déjà membre ?{' '}
                        <Link href="/login" className="text-blue-600 font-bold hover:underline">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function FormInput({ label, name, type, placeholder, icon }: { label: string, name: string, type: string, placeholder: string, icon: any }) {
    return (
        <div className="space-y-1.5 w-full">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{label}</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    {icon}
                </div>
                <input
                    name={name}
                    type={type}
                    required={name !== 'organization' && name !== 'phone' && name !== 'dob'} // Optional mainly likely for nice UX if backend doesn't require
                    placeholder={placeholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                />
            </div>
        </div>
    )
}
