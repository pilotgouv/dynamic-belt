import React from 'react';
import { ArrowRight, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
    title: string;
    message: string;
    actionLabel: string;
    actionUrl?: string; // If it's a link
    onAction?: () => void; // If it's a button click
    secondaryText?: string;
    icon?: React.ReactNode;
}

export function EmptyState({ title, message, actionLabel, actionUrl, onAction, secondaryText, icon }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-12 max-w-2xl mx-auto rounded-3xl bg-white border border-gray-100 shadow-sm min-h-[400px]">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-6 shadow-inner">
                {icon || <Lock size={28} />}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">{title}</h2>

            <p className="text-gray-500 mb-8 leading-relaxed max-w-lg mx-auto">
                {message}
            </p>

            {actionUrl ? (
                <Link
                    href={actionUrl}
                    className="group inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                    {actionLabel}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            ) : (
                <button
                    onClick={onAction}
                    className="group inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                    {actionLabel}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            )}

            {secondaryText && (
                <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-full">
                    <AlertCircle size={12} />
                    {secondaryText}
                </div>
            )}
        </div>
    );
}
