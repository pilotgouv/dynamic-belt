"use client";

import { useEffect } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <div className="animate-in fade-in duration-700 ease-out fill-mode-backwards">
            {children}
        </div>
    );
}
