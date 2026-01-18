/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
            fontFamily: {
                sans: ['var(--font-inter)'],
                audiowide: ['var(--font-audiowide)'],
                montserrat: ['var(--font-montserrat)'],
            },
            animation: {
                heartbeat: 'heartbeat 3s infinite ease-in-out',
            },
            keyframes: {
                heartbeat: {
                    '0%, 100%': { opacity: '0.05', transform: 'scale(1)' },
                    '15%': { opacity: '0.3', transform: 'scale(1.015)' },
                    '30%': { opacity: '0.05', transform: 'scale(1)' },
                    '45%': { opacity: '0.3', transform: 'scale(1.015)' },
                    '60%': { opacity: '0.05', transform: 'scale(1)' },
                }
            },
        },
    },
    plugins: [],
};
