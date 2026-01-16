
'use client';

import React from 'react';
import { RefreshCw, Settings, X, Power, HelpCircle, LifeBuoy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface CircularMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSync: () => void;
    isSyncing: boolean;
}

export default function CircularMenu({ isOpen, onClose, onSync, isSyncing }: CircularMenuProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleNav = (path: string) => {
        router.push(path);
        onClose();
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            {/* Circular Menu Container */}
            <div className="relative w-[340px] h-[340px] flex items-center justify-center animate-in zoom-in-95 duration-300">

                {/* Central Hub (Logo/Close) */}
                <div
                    className="absolute z-30 w-28 h-28 bg-white/90 backdrop-blur-xl rounded-full shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center border-4 border-indigo-500/50 hover:scale-105 transition-all cursor-pointer group"
                    onClick={onClose}
                >
                    <X size={36} className="text-indigo-900 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="absolute -bottom-8 text-white/50 text-[10px] tracking-widest uppercase font-mono">Fermer</span>
                </div>

                {/* Ring Item 1 - Sync (Top) */}
                <button
                    onClick={onSync}
                    disabled={isSyncing}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full flex flex-col items-center justify-center text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] hover:from-indigo-500 hover:to-blue-500 hover:scale-110 hover:-translate-y-2 transition-all border-4 border-white/10 group z-20"
                >
                    <RefreshCw size={28} className={isSyncing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"} />
                    <span className="text-[10px] uppercase font-bold mt-2 tracking-wide">Sync</span>
                </button>

                {/* Ring Item 2 - Settings (Right) */}
                <button
                    onClick={() => handleNav('/dashboard/settings')}
                    className="absolute top-1/2 -right-6 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex flex-col items-center justify-center text-white shadow-[0_10px_30px_-10px_rgba(15,23,42,0.5)] hover:from-slate-600 hover:to-slate-800 hover:scale-110 hover:translate-x-2 transition-all border-4 border-white/10 z-20"
                >
                    <Settings size={28} className="text-slate-200" />
                    <span className="text-[10px] uppercase font-bold mt-2 tracking-wide text-slate-200">Config</span>
                </button>

                {/* Ring Item 3 - Help (Bottom) */}
                <button
                    onClick={() => handleNav('/dashboard/help')}
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex flex-col items-center justify-center text-white shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] hover:from-emerald-500 hover:to-teal-500 hover:scale-110 hover:translate-y-2 transition-all border-4 border-white/10 z-20"
                >
                    <LifeBuoy size={28} />
                    <span className="text-[10px] uppercase font-bold mt-2 tracking-wide">Aide</span>
                </button>

                {/* Ring Item 4 - Logout (Left) */}
                <button
                    onClick={handleLogout}
                    className="absolute top-1/2 -left-6 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-rose-600 to-pink-600 rounded-full flex flex-col items-center justify-center text-white shadow-[0_10px_30px_-10px_rgba(225,29,72,0.5)] hover:from-rose-500 hover:to-pink-500 hover:scale-110 hover:-translate-x-2 transition-all border-4 border-white/10 z-20"
                >
                    <Power size={28} />
                    <span className="text-[10px] uppercase font-bold mt-2 tracking-wide">Sortie</span>
                </button>

                {/* Decorative Orbit Rings (Layered) */}
                <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_20s_linear_infinite]" style={{ margin: '-40px' }}></div>
                <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-[spin_15s_linear_infinite_reverse]" style={{ margin: '-10px' }}></div>
                <div className="absolute inset-0 rounded-full border border-purple-500/10 animate-[spin_25s_linear_infinite]" style={{ margin: '20px' }}></div>

            </div>
        </div>
    );
}
