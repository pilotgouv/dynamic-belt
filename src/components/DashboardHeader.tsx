'use client';
import { useDateRange, DatePeriod } from '@/context/DateRangeContext';
import { usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';

export default function DashboardHeader() {
    const { range, setPeriod, setCustomRange } = useDateRange();
    const pathname = usePathname();

    const getTitle = () => {
        if (pathname.includes('/overview')) return "Vue d'ensemble";
        if (pathname.includes('/finance')) return "Finance";
        if (pathname.includes('/ads')) return "Performance Ads";
        if (pathname.includes('/traffic')) return "Trafic";
        if (pathname.includes('/products')) return "Produits";
        if (pathname.includes('/reports')) return "Bibliothèque";
        if (pathname.includes('/connections')) return "Connexions";
        if (pathname.includes('/account')) return "Mon Compte";
        return "Business Cockpit";
    };

    const options: { label: string, value: DatePeriod }[] = [
        { label: '7J', value: 'last_7_days' },
        { label: '30J', value: 'last_30_days' },
        { label: '90J', value: 'last_90_days' },
        { label: 'YTD', value: 'year_to_date' },
        { label: '1 An', value: 'last_year' },
        { label: 'Tout', value: 'all_time' },
    ];

    return (
        <header className="fixed top-0 right-0 left-[250px] z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 px-8 flex items-center justify-between">
            {/* Left: Breadcrumb or Title */}
            <div className="flex flex-col justify-center">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Dashboard</span>
                <span className="text-lg font-bold text-gray-900 tracking-tight leading-none">{getTitle()}</span>
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

                {range.period === 'custom' ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                        <input
                            type="date"
                            value={range.start ? range.start.toISOString().split('T')[0] : ''}
                            onChange={(e) => setCustomRange(new Date(e.target.value), range.end)}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-black outline-none"
                        />
                        <span className="text-gray-400 text-xs">to</span>
                        <input
                            type="date"
                            value={range.end ? range.end.toISOString().split('T')[0] : ''}
                            onChange={(e) => setCustomRange(range.start, new Date(e.target.value))}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-black outline-none"
                        />
                        <button onClick={() => setPeriod('last_30_days')} className="ml-1 p-1 hover:bg-gray-200 rounded-full text-gray-400">
                            ✕
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setPeriod('custom')}
                        className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:text-black flex items-center gap-1 hover:bg-white hover:shadow-sm transition-all"
                    >
                        <Calendar size={12} /> Personnalisé
                    </button>
                )}
            </div>
        </header>
    );
}
