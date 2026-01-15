"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, ArrowRight, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        // Logic to send email would go here
    };

    return (
        <div className="flex min-h-screen bg-black font-sans text-white overflow-hidden items-center justify-center relative">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
            <div className="absolute top-0 w-full h-full bg-gradient-to-br from-blue-900/20 to-transparent pointer-events-none"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm font-medium">
                    <ArrowLeft size={16} /> Retour à la connexion
                </Link>

                <div className="bg-white text-black p-8 rounded-2xl shadow-2xl">
                    {!sent ? (
                        <>
                            <h1 className="text-2xl font-bold mb-2">Mot de passe oublié ?</h1>
                            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                                Entrez votre email ci-dessous. Nous vous enverrons un lien magique pour réinitialiser votre accès.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
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
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-black hover:bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    Envoyer le lien <ArrowRight size={18} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Email envoyé !</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Vérifiez votre boîte de réception (et vos spams). Un lien de réinitialisation vous attend.
                            </p>
                            <button
                                onClick={() => setSent(false)}
                                className="text-sm font-semibold text-gray-400 hover:text-black transition-colors"
                            >
                                Rien reçu ? Réessayer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
