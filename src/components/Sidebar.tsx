'use client';

import React, { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import {
    LayoutDashboard,
    Wallet,
    Users,
    Megaphone,
    Package,
    Link as LinkIcon,
    FileText,
    LogOut,
    Check
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import CircularMenu from './CircularMenu';

const MENU_ITEMS = [
    { label: 'Vue d\'ensemble', icon: LayoutDashboard, path: '/dashboard/overview' },
    { label: 'Finance', icon: Wallet, path: '/dashboard/finance' },
    { label: 'Performance Ads', icon: Megaphone, path: '/dashboard/ads' },
    { label: 'Trafic', icon: Users, path: '/dashboard/traffic' },
    { label: 'Produits', icon: Package, path: '/dashboard/products' },
    { label: 'Bibliothèque', icon: FileText, path: '/dashboard/reports' },
    { label: 'Connexions', icon: LinkIcon, path: '/dashboard/connections' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Sync Logic
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'done'>('idle');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSyncing && syncProgress < 90) {
            interval = setInterval(() => {
                setSyncProgress(prev => Math.min(prev + (Math.random() * 10), 90));
            }, 200);
        }
        return () => clearInterval(interval);
    }, [isSyncing, syncProgress]);

    const handleSync = async () => {
        if (isSyncing || syncStatus === 'running') return; // Security Check

        setIsSyncing(true);
        setSyncStatus('running');
        setSyncProgress(0);

        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullSync: true })
            });
            if (res.ok) {
                setSyncProgress(100);
                setSyncStatus('done');
                setTimeout(() => {
                    window.location.reload();
                }, 800);
            } else {
                alert("Erreur Sync.");
                setIsSyncing(false);
                setSyncStatus('idle');
            }
        } catch (e) {
            alert("Erreur réseau.");
            setIsSyncing(false);
            setSyncStatus('idle');
        }
    };

    return (
        <>
            {/* Circular Menu Overlay */}
            <CircularMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onSync={() => { handleSync(); setIsMenuOpen(false); }}
                isSyncing={isSyncing}
            />

            <aside className={styles.sidebar}>
                {/* LOGO AREA - Bigger & Interactive */}
                <div className="relative h-24 flex items-center justify-center mb-4 cursor-pointer group" onClick={() => setIsMenuOpen(true)}>
                    {/* Fluid Green Ring */}
                    <svg className="absolute w-20 h-20 rotate-[-90deg]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" stroke="#e5e7eb" strokeWidth="2" fill="none" />
                        {isSyncing && (
                            <circle
                                cx="50" cy="50" r="46"
                                stroke="#10b981"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray="290"
                                strokeDashoffset={290 - (290 * syncProgress) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-300 ease-out"
                            />
                        )}
                        {!isSyncing && (
                            <circle
                                cx="50" cy="50" r="46"
                                stroke="#10b981"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray="290"
                                strokeDashoffset="290"
                                className="group-hover:stroke-dashoffset-[0] transition-all duration-1000 ease-in-out opacity-50"
                            />
                        )}
                    </svg>

                    {/* Logo Image */}
                    <div className="relative z-10 p-2 bg-white rounded-full shadow-sm group-hover:scale-105 transition-transform">
                        <Image src="/brand/logopilot.png" alt="PILOT" width={48} height={48} className="object-contain" />
                    </div>
                </div>

                <div className="text-center mb-6">
                    <span className="font-bold tracking-widest text-lg uppercase text-gray-900">PILOT</span>
                    <div className="text-[10px] text-gray-400 font-mono">Boardroom BI</div>
                </div>

                <nav className={styles.nav}>
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                href={item.path}
                                key={item.path}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    {/* Sync Button / Progress Bar */}
                    <div className="mb-4 px-4">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className={`w-full relative overflow-hidden h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                                ${isSyncing
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    : 'bg-black text-white hover:bg-gray-800 shadow-lg active:scale-95'
                                }
                            `}
                        >
                            {/* Progress Fill */}
                            {isSyncing && (
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-green-100 transition-all duration-300"
                                    style={{ width: `${syncProgress}%` }}
                                ></div>
                            )}

                            {/* Label */}
                            <div className="relative z-10 flex items-center gap-2">
                                {isSyncing ? (
                                    <>
                                        {syncProgress < 100 ? (
                                            <>Synchronisation... {Math.round(syncProgress)}%</>
                                        ) : (
                                            <><Check size={14} className="text-green-600" /> Terminé</>
                                        )}
                                    </>
                                ) : (
                                    "⚡ Sync Données"
                                )}
                            </div>
                        </button>
                    </div>

                    <div className={styles.user}>
                        <Link href="/dashboard/account" className="flex items-center gap-3 no-underline text-inherit flex-1">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-100">
                                M
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold leading-none">Mon Compte</span>
                                <span className="text-[10px] text-gray-500">Premium</span>
                            </div>
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Déconnexion"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
