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

const MENU_ITEMS = [
    { label: 'Vue Générale', icon: LayoutDashboard, path: '/' },
    { label: 'Argent', icon: Wallet, path: '/finance' },
    { label: 'Trafic & Acquisition', icon: Users, path: '/acquisition' },
    { label: 'Publicité', icon: Megaphone, path: '/ads' },
    { label: 'Produits & Offres', icon: Package, path: '/products' },
    { label: 'Alertes & IA', icon: Bot, path: '/alerts' },
    { label: 'Historique', icon: History, path: '/timeline' },
    { label: 'Rapports', icon: FileText, path: '/reports' },
    { label: 'Connexions', icon: LinkIcon, path: '/connections' },
    { label: 'Paramètres', icon: Settings, path: '/settings' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div style={{ width: 8, height: 8, background: 'var(--accent-gold)', borderRadius: '50%' }} />
                PILOT
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
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                        onClick={() => {
                            // We'll hook this up to useSyncEngine later or via a context
                            alert("Synchronisation lancée...");
                        }}
                    >
                        <RefreshCw size={12} /> Sync. Données
                    </button>
                </div>

                <div className={styles.user}>
                    <Link href="/account" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', flex: 1 }}>
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
