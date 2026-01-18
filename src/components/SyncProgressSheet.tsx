"use client";

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function SyncProgressSheet() {
    const [status, setStatus] = useState<any>(null);
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [userClosed, setUserClosed] = useState(false);

    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await fetch('/api/sync/status');
                if (res.ok) {
                    const data = await res.json();

                    // Logic: Show if running, or if recently finished (and was visible)
                    if (data.status === 'running' && !userClosed) {
                        setStatus(data);
                        setVisible(true);
                    } else if (visible && (data.status === 'done' || data.status === 'success')) {
                        setStatus(data);
                        // Hide after 5 seconds of success ONLY WHEn logs are closed
                        if (!expanded) {
                            setTimeout(() => {
                                setVisible(false);
                                window.location.reload();
                            }, 2000);
                        }
                    } else if (visible && data.status === 'error') {
                        setStatus(data);
                    }

                    // Update Logs
                    setLogs(prev => {
                        const last = prev[prev.length - 1];
                        const sig = `${data.stage}-${data.message}-${data.progress}`;
                        if (!last || last.sig !== sig) {
                            return [...prev, { ...data, timestamp: new Date(), sig }];
                        }
                        return prev;
                    });
                }
            } catch (e) { }
        }, 1000);
        return () => clearInterval(poll);
    }, [visible, expanded]);

    if (!visible || !status) return null;

    const startTime = logs.length > 0 ? new Date(logs[0].timestamp).getTime() : Date.now();
    const duration = Math.round((Date.now() - startTime) / 1000);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-4 z-[100] flex items-center gap-4 transition-all duration-500 animate-in slide-in-from-bottom-12 fade-in zoom-in-95">
            <div className="flex-shrink-0">
                {status.status === 'running' && <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl"><Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" /></div>}
                {(status.status === 'done' || status.status === 'success') && <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>}
                {status.status === 'error' && <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-500" /></div>}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                    <p className={`text-sm font-semibold truncate pr-4 ${status.message?.includes('Skipped') ? 'text-amber-600 dark:text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                        {status.message || 'Synchronisation en cours...'}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono">{duration}s</span>
                        <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/5">{Math.round(status.progress) || 0}%</span>
                    </div>
                </div>

                <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ease-linear ${status.status === 'error' ? 'bg-red-500' :
                            status.message?.includes('Skipped') ? 'bg-amber-500' :
                                'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500'
                            }`}
                        style={{ width: `${status.progress}%` }}
                    />
                </div>

                <div className="flex justify-between items-center mt-1">
                    <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-gray-400 hover:text-gray-600 underline">
                        {expanded ? 'Fermer Debug' : 'Debug Logs'}
                    </button>
                    {(status.status === 'success' || status.status === 'done') && (
                        <button onClick={() => window.location.reload()} className="text-[10px] text-emerald-600 font-bold hover:underline">
                            Rafraîchir la page
                        </button>
                    )}
                </div>

                {expanded && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-black/20 rounded text-[10px] font-mono text-gray-500 h-48 overflow-y-auto border border-gray-100 dark:border-white/5 scrollbar-thin">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/10">
                                    <th className="pb-1 w-16">Time</th>
                                    <th className="pb-1 w-24">Stage</th>
                                    <th className="pb-1">Message</th>
                                    <th className="pb-1 w-10 text-right">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-100/50 dark:hover:bg-white/5">
                                        <td className="py-1 pr-2 align-top text-gray-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}</td>
                                        <td className="py-1 pr-2 align-top font-semibold truncate max-w-[100px]">{log.stage}</td>
                                        <td className="py-1 pr-2 align-top break-words">{log.message}</td>
                                        <td className="py-1 align-top text-right">{log.progress}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <button onClick={async () => {
                    try { await fetch('/api/sync/stop', { method: 'POST' }); } catch (e) { }
                    setStatus((s: any) => ({ ...s, message: 'Arrêt demandé...', status: 'stopping' }));
                }} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors group" title="Arrêter">
                    <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                </button>
                <button onClick={() => {
                    setVisible(false);
                    setExpanded(false);
                    setUserClosed(true);
                    if (status && (status.status === 'stopping' || status.status === 'error' || status.status === 'failed')) {
                        window.location.reload();
                    }
                }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors group">
                    <XCircle className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                </button>
            </div>
        </div>
    );
}
