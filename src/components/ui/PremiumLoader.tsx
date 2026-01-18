"use client";

import React, { useEffect, useState } from 'react';

export const PremiumLoader = () => {
    // Simple robust loader component that fits in the parent container
    return (
        <div className="flex items-center justify-center w-full min-h-[50vh] animate-in fade-in duration-500">
            <div className="relative w-40 h-40 sm:w-56 sm:h-56 flex items-center justify-center">
                <video
                    src="/loaderpilot_ultralight.mp4"
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain mix-blend-multiply"
                />
            </div>
        </div>
    );
};
