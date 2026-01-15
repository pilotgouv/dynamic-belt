import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    delta?: number;
    prefix?: string;
    suffix?: string;
    description?: string;
    loading?: boolean;
}

export function KPICard({ title, value, delta, prefix = '', suffix = '', description, loading = false }: KPICardProps) {

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-100 rounded w-1/2"></div>
            </div>
        );
    }

    const isPositive = delta && delta > 0;
    const isNegative = delta && delta < 0;
    const isNeutral = !delta || delta === 0;

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-medium text-gray-500 tracking-wide">{title}</h3>
                {delta !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-50 text-green-700' :
                            isNegative ? 'bg-red-50 text-red-700' :
                                'bg-gray-50 text-gray-500'
                        }`}>
                        {isPositive ? <ArrowUpRight size={12} /> : isNegative ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                        {Math.abs(delta).toFixed(1)}%
                        <span className="font-normal opacity-70 ml-1">vs prev</span>
                    </div>
                )}
            </div>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">
                    {prefix}{value}{suffix}
                </span>
            </div>
            {description && (
                <p className="text-xs text-gray-400 mt-2 font-medium">{description}</p>
            )}
        </div>
    );
}
