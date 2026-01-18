"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function LogsViewer({ logs }: { logs: any[] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 overflow-hidden">
            <div
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Logs Système (Debug)</h3>
                        <p className="text-xs text-gray-500">Historique des 20 dernières synchronisations</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </div>

            {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50 p-6 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 text-xs font-bold text-gray-500">Date/Heure</th>
                                <th className="p-2 text-xs font-bold text-gray-500">Provider</th>
                                <th className="p-2 text-xs font-bold text-gray-500">Status</th>
                                <th className="p-2 text-xs font-bold text-gray-500">Durée</th>
                                <th className="p-2 text-xs font-bold text-gray-500">Items</th>
                                <th className="p-2 text-xs font-bold text-gray-500">Message</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {logs.map((log) => {
                                let details = {};
                                try { details = JSON.parse(log.details || '{}'); } catch (e) { }
                                return (
                                    <tr key={log.id} className="border-b border-gray-200 hover:bg-white transition-colors font-mono text-xs">
                                        <td className="p-2 text-gray-600">{new Date(log.startedAt).toLocaleString()}</td>
                                        <td className="p-2 font-bold">{log.provider}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${log.status === 'success' ? 'bg-green-100 text-green-700' :
                                                log.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="p-2 text-gray-500">{(log.durationMs / 1000).toFixed(1)}s</td>
                                        <td className="p-2 font-bold">{log.itemsImported}</td>
                                        <td className="p-2 text-gray-600 max-w-xs truncate" title={(details as any).error || (details as any).message || ''}>
                                            {(details as any).error ? (
                                                <span className="text-red-600 font-semibold">{(details as any).error}</span>
                                            ) : (
                                                (details as any).message || '-'
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    <div className="mt-4 text-xs text-gray-400 text-center">
                        Raw logs accessible via API for full json
                    </div>
                </div>
            )}
        </div>
    );
}
