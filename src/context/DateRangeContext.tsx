'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type DatePeriod = 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'month_to_date' | 'year_to_date' | 'last_year' | 'custom' | 'all_time';

interface DateRange {
    start: Date;
    end: Date;
    period: DatePeriod;
}

interface DateRangeContextType {
    range: DateRange;
    setPeriod: (period: DatePeriod) => void;
    setCustomRange: (start: Date, end: Date) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Default to last 30 days
    const [range, setRangeState] = useState<DateRange>(() => calculateRange('last_30_days'));

    // Sync from URL on mount
    useEffect(() => {
        const p = searchParams.get('period') as DatePeriod;
        const s = searchParams.get('start');
        const e = searchParams.get('end');

        if (p && isValidPeriod(p)) {
            setRangeState(calculateRange(p));
        } else if (s && e) {
            setRangeState({
                start: new Date(s),
                end: new Date(e),
                period: 'custom'
            });
        }
    }, []);

    // Helper to calculate dates
    function calculateRange(period: DatePeriod): DateRange {
        const end = new Date();
        // End of today (23:59:59)
        end.setHours(23, 59, 59, 999);

        const start = new Date(end);
        start.setHours(0, 0, 0, 0);

        switch (period) {
            case 'today':
                break;
            case 'last_7_days':
                start.setDate(end.getDate() - 7);
                break;
            case 'last_30_days':
                start.setDate(end.getDate() - 30);
                break;
            case 'last_90_days':
                start.setDate(end.getDate() - 90);
                break;
            case 'month_to_date':
                start.setDate(1);
                break;
            case 'year_to_date':
                start.setMonth(0, 1);
                break;
            case 'last_year':
                start.setFullYear(start.getFullYear() - 1);
                start.setMonth(0, 1);
                end.setFullYear(end.getFullYear() - 1);
                end.setMonth(11, 31);
                break;
            case 'all_time':
                start.setFullYear(2000, 0, 1);
                break;
        }
        return { start, end, period };
    }

    function isValidPeriod(p: string): boolean {
        return ['today', 'last_7_days', 'last_30_days', 'last_90_days', 'month_to_date', 'year_to_date', 'last_year', 'all_time'].includes(p);
    }

    const setPeriod = (period: DatePeriod) => {
        const newRange = calculateRange(period);
        setRangeState(newRange);
        // Optional: Update URL
        // router.push(`?period=${period}`); 
    };

    const setCustomRange = (start: Date, end: Date) => {
        end.setHours(23, 59, 59, 999);
        start.setHours(0, 0, 0, 0);
        setRangeState({ start, end, period: 'custom' });
    };

    return (
        <DateRangeContext.Provider value={{ range, setPeriod, setCustomRange }}>
            {children}
        </DateRangeContext.Provider>
    );
}

export function useDateRange() {
    const context = useContext(DateRangeContext);
    if (!context) throw new Error("useDateRange must be used within DateRangeProvider");
    return context;
}
