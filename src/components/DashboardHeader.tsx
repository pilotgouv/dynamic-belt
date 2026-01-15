'use client';
import { useDateRange, DatePeriod } from '@/context/DateRangeContext';
import { Calendar } from 'lucide-react';

export default function DashboardHeader() {
    const { range, setPeriod } = useDateRange();

    const options: { label: string, value: DatePeriod }[] = [
        { label: '7J', value: 'last_7_days' },
        { label: '30J', value: 'last_30_days' },
        { label: '90J', value: 'last_90_days' },
        { label: 'YTD', value: 'year_to_date' },
        { label: '1 An', value: 'last_year' },
    ];

    return (
        <header className="fixed top-0 right-0 left-[250px] z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 px-8 flex items-center justify-between">
            {/* Left: Breadcrumb or Title (optional) */}
            <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                <span>Business Cockpit</span>
            </div>

            {/* Right: Date Picker */}
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-full border border-gray-100">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setPeriod(opt.value)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${range.period === opt.value
                                ? 'bg-white text-black shadow-sm'
                                : 'text-gray-500 hover:text-black'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:text-black flex items-center gap-1">
                    <Calendar size={12} /> Personnalisé
                </button>
            </div>
        </header>
    );
}
