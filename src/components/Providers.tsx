
"use client";

import { SessionProvider } from "next-auth/react";

import { Suspense } from 'react';
import { DateRangeProvider } from "@/context/DateRangeContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <Suspense fallback={null}>
                <DateRangeProvider>
                    {children}
                </DateRangeProvider>
            </Suspense>
        </SessionProvider>
    );
}
