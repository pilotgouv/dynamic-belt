"use client";

import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Activity, Wifi, X } from 'lucide-react';

export default function DebugPanel() {
    const [isVisible, setIsVisible] = useState(false);

    // Toggle with key combo (e.g. Ctrl + . )
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === '.') {
                setIsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden w-80 font-mono text-xs">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider">
                        <Terminal size={12} />
                        <span>PilotOS Kernel</span>
                    </div>
                    <button onClick={() => setIsVisible(false)} className="text-slate-500 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 text-slate-300">

                    {/* Status Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900 rounded p-2 border border-slate-800">
                            <div className="text-[10px] text-slate-500 mb-1">ENV</div>
                            <div className="font-bold text-white flex items-center gap-1.5 point">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                PRODUCTION
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded p-2 border border-slate-800">
                            <div className="text-[10px] text-slate-500 mb-1">VERSION</div>
                            <div className="font-bold text-blue-400">v2.6.0-rc4</div>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                            <span className="flex items-center gap-2 text-slate-400"><Cpu size={12} /> RENDER</span>
                            <span className="text-emerald-400 font-bold">12ms</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                            <span className="flex items-center gap-2 text-slate-400"><Wifi size={12} /> LATENCY</span>
                            <span className="text-emerald-400 font-bold">24ms</span>
                        </div>
                    </div>

                    {/* Console Stream mockup */}
                    <div className="h-24 overflow-hidden relative">
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
                        <div className="space-y-1 text-[10px] opacity-70">
                            <div className="flex gap-2"><span className="text-slate-600">[14:02:22]</span> <span className="text-blue-400">INFO</span> Interface mounted</div>
                            <div className="flex gap-2"><span className="text-slate-600">[14:02:23]</span> <span className="text-blue-400">INFO</span> Hydration complete</div>
                            <div className="flex gap-2"><span className="text-slate-600">[14:02:24]</span> <span className="text-purple-400">WAIT</span> Connecting to mesh...</div>
                            <div className="flex gap-2"><span className="text-slate-600">[14:02:24]</span> <span className="text-emerald-400">OK</span> Connected (secure)</div>
                        </div>
                    </div>

                </div>

                {/* Footer bar */}
                <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                    <span>MEM: 42MB</span>
                    <span>UID: guest-291</span>
                </div>
            </div>
        </div>
    );
}
