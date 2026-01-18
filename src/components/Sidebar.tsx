"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Megaphone,
    BarChart3,
    Settings,
    Plug,
    User as UserIcon,
    Globe
} from 'lucide-react';
import styles from './Sidebar.module.css';
import CircularMenu from './CircularMenu';

const MENU_ITEMS = [
    { label: 'Vue d\'ensemble', path: '/dashboard/overview', icon: LayoutDashboard },
    { label: 'Trafic', path: '/dashboard/traffic', icon: Globe },
    { label: 'Produits', path: '/dashboard/products', icon: Package },
    { label: 'Finance', path: '/dashboard/finance', icon: BarChart3 },
    { label: 'Performance Ads', path: '/dashboard/ads', icon: Megaphone },
    { label: 'Rapports', path: '/dashboard/reports', icon: BarChart3 },
    { label: 'Connexions', path: '/dashboard/connections', icon: Plug },
    { label: 'Paramètres', path: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'done'>('idle');

    // Poll sync status
    useEffect(() => {
        let interval: any;
        if (isSyncing || syncStatus === 'running') {
            interval = setInterval(async () => {
                try {
                    const res = await fetch('/api/sync/status');
                    const data = await res.json();

                    if (data.status === 'running') {
                        setSyncStatus('running');
                        const remoteProgress = data.progress || 0;
                        setSyncProgress(prev => Math.max(prev, remoteProgress));
                    } else if (data.status === 'success' || data.status === 'done') {
                        setSyncStatus('done');
                        setIsSyncing(false);
                        setSyncProgress(100);
                        clearInterval(interval);

                        if (data.jobStatus === 'partial_success') {
                            console.warn(`Synchronisation terminée avec avertissements :\n${data.error || 'Certaines sources ont échoué.'}`);
                        }

                        setTimeout(() => window.location.reload(), 1500);
                    } else if (data.status === 'error' || data.status === 'failed') {
                        setSyncStatus('idle');
                        setIsSyncing(false);
                        clearInterval(interval);
                        console.error(`Erreur de synchronisation :\n${data.error || 'Erreur inconnue'}`);
                    }
                } catch (e) {
                    console.error("Sync poll error", e);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isSyncing, syncStatus]);

    const handleSync = async () => {
        if (isSyncing || syncStatus === 'running') return;

        setIsMenuOpen(false);
        setIsSyncing(true);
        setSyncStatus('running');
        setSyncProgress(5);

        try {
            await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullSync: false })
            });
        } catch (e) {
            console.error("Trigger sync failed", e);
            setIsSyncing(false);
            setSyncStatus('idle');
        }
    };

    return (
        <>
            {/* Global Overlay Menu (Outside Sidebar DOM flow ideally, but absolute works if no transform on parent) */}
            {isMenuOpen && (
                <CircularMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    onSync={handleSync}
                    isSyncing={isSyncing}
                    syncProgress={syncProgress}
                />
            )}

            <aside className={`${styles.sidebar} h-screen flex flex-col bg-white border-r border-gray-100`}>

                {/* Logo Section - Compact */}
                <div className="flex flex-col items-center justify-center pt-3 pb-2 w-full shrink-0">
                    <div className="relative w-28 h-28 flex items-center justify-center mb-2">
                        <div className={`absolute inset-0 rounded-full border-2 border-gray-100 ${syncStatus === 'done' ? 'ring-2 ring-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)]' : ''}`}></div>

                        {/* Green Spinner */}
                        <svg className={`absolute inset-0 w-full h-full transition-all duration-1000 ${isSyncing ? 'animate-spin opacity-100 text-green-500' : 'opacity-0 text-gray-200'}`} viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="50 100" strokeLinecap="round" />
                        </svg>

                        <div
                            className="relative z-10 bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-sm border border-gray-120 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <img
                                src="/brand/logopilot.png"
                                alt="PILOT"
                                className="w-20 h-20 object-contain"
                            />
                        </div>
                    </div>

                    <div className="text-center mt-2">
                        <h1 className="font-montserrat font-semibold tracking-wide text-2xl text-[#1A1A1A]">PILOT</h1>
                    </div>
                </div>

                {/* Navigation - Flexible & Compact */}
                <nav className="flex-1 px-3 w-full space-y-2 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                href={item.path}
                                key={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-[#1A1A1A] text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-3 w-full shrink-0 space-y-3">

                    {/* Sync Button: Progress Style */}
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="relative w-full h-10 bg-gray-100 rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        {/* Background Progress */}
                        {isSyncing && (
                            <div
                                className="absolute inset-0 bg-green-500 transition-all duration-700 ease-out"
                                style={{ width: `${syncProgress}%` }}
                            />
                        )}

                        {/* Content Layer */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 z-10">
                            {isSyncing ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wider mix-blend-overlay">
                                        Sync... {Math.round(syncProgress)}%
                                    </span>
                                </>
                            ) : (
                                <span className="text-xs font-bold text-gray-700 group-hover:text-black uppercase tracking-wider">UPDATE</span>
                            )}
                        </div>
                    </button>

                    {/* User Profile */}
                    <Link href="/dashboard/account" className="block w-full">
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
                                MV
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-semibold text-xs text-gray-900 truncate">M Vicario</span>
                                <span className="text-[10px] text-gray-400 truncate">Administrateur</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </aside>
        </>
    );
}
