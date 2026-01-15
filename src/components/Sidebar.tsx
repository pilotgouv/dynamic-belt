"use client";

import React from 'react';
import styles from './Sidebar.module.css';
import {
    LayoutDashboard,
    Wallet,
    Users,
    Megaphone,
    Package,
    Bot,
    History,
    Link as LinkIcon,
    Settings,
    RefreshCw,
    FileText,
    LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Image from 'next/image';

const MENU_ITEMS = [
    { label: 'Vue d\'ensemble', icon: LayoutDashboard, path: '/dashboard/overview' },
    { label: 'Finance', icon: Wallet, path: '/dashboard/finance' },
    { label: 'Performance Ads', icon: Megaphone, path: '/dashboard/ads' },
    { label: 'Trafic', icon: Users, path: '/dashboard/traffic' },
    { label: 'Produits', icon: Package, path: '/dashboard/products' },
    { label: 'Bibliothèque', icon: FileText, path: '/dashboard/reports' },
    { label: 'Connexions', icon: LinkIcon, path: '/dashboard/connections' },
    { label: 'Mon Compte', icon: Users, path: '/dashboard/account' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isSyncing, setIsSyncing] = React.useState(false);

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Image src="/brand/logopilot.png" alt="PILOT" width={28} height={28} />
                    <span className="font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>PILOT</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', marginLeft: '36px' }}>Boardroom BI</div>
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
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <div style={{ marginBottom: '1rem', padding: '0 1rem' }}>
                    <button
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white text-xs font-medium rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 border border-transparent"
                        onClick={async () => {
                            if (isSyncing) return;
                            setIsSyncing(true);
                            try {
                                const res = await fetch('/api/sync', { method: 'POST', body: JSON.stringify({ fullSync: true }) });
                                if (res.ok) {
                                    alert("Synchronisation complète lancée (Historique > 2020). La page va se recharger.");
                                    window.location.reload();
                                } else {
                                    alert("Erreur lors de la synchronisation.");
                                }
                            } catch (e) {
                                console.error(e);
                                alert("Erreur réseau.");
                            } finally {
                                setIsSyncing(false);
                            }
                        }}
                    >
                        <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} /> Sync. Données
                    </button>
                </div>

                <div className={styles.user}>
                    <Link href="/dashboard/account" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', flex: 1 }}>
                        <div className={styles.avatar}>M</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ lineHeight: 1 }}>Mon Compte</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gérer</span>
                        </div>
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}
                        title="Déconnexion"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
