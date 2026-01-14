"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSettings, IntegrationConnection } from '@/types/data';
import { DEFAULT_SETTINGS } from '@/lib/engine';

interface AppState {
    settings: UserSettings;
    updateSettings: (newSettings: Partial<UserSettings>) => void;
    connections: IntegrationConnection[];
    toggleConnection: (id: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

    // Initialize Mock Connections
    const [connections, setConnections] = useState<IntegrationConnection[]>([
        { id: 'shopify', provider: 'shopify', name: 'Shopify Store', status: 'connected', lastSyncAt: 'Just now' },
        { id: 'google_ads', provider: 'google_ads', name: 'Google Ads', status: 'connected', lastSyncAt: '5 min ago' },
        { id: 'meta_ads', provider: 'meta_ads', name: 'Meta Ads', status: 'connected', lastSyncAt: '5 min ago' },
        { id: 'ga4', provider: 'ga4', name: 'Google Analytics 4', status: 'disconnected' },
    ]);

    // Load from local storage on mount (Simulation)
    useEffect(() => {
        const stored = localStorage.getItem('pilot_settings');
        if (stored) {
            setSettings(JSON.parse(stored));
        }
    }, []);

    const updateSettings = (newSettings: Partial<UserSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('pilot_settings', JSON.stringify(updated));
            return updated;
        });
    };

    const toggleConnection = (id: string) => {
        setConnections(prev => prev.map(c => {
            if (c.id === id) {
                // Simulate OAuth Flow / Connection Loading
                if (c.status === 'disconnected') {
                    return { ...c, status: 'syncing' };
                }
                return { ...c, status: c.status === 'connected' ? 'disconnected' : 'connected' };
            }
            return c;
        }));

        // Mock the async finish of connection
        const target = connections.find(c => c.id === id);
        if (target && target.status === 'disconnected') {
            setTimeout(() => {
                setConnections(prev => prev.map(c =>
                    c.id === id ? { ...c, status: 'connected', lastSyncAt: 'Just now' } : c
                ));
            }, 2000);
        }
    };

    return (
        <AppContext.Provider value={{ settings, updateSettings, connections, toggleConnection }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
