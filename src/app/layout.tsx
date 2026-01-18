import type { Metadata } from "next";
import { Inter, Audiowide, Montserrat } from "next/font/google"; // Use Inter for premium, corporate look
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const audiowide = Audiowide({
  weight: "400",
  variable: "--font-audiowide",
  subsets: ["latin"],
  display: 'swap',
});

const montserrat = Montserrat({
  weight: "600",
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Business Pilot - Vision Stratégique",
  description: "Plateforme SaaS premium de pilotage business.",
};

import Sidebar from "@/components/Sidebar";
import { AppProvider } from "@/hooks/useApp";

import { Providers } from "@/components/Providers";

import SyncProgressSheet from "@/components/SyncProgressSheet";
import DebugPanel from "@/components/DebugPanel";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${audiowide.variable} ${montserrat.variable}`}>
      <body>
        <Providers>
          <AppProvider>
            {children}
            <SyncProgressSheet />
            <DebugPanel />
          </AppProvider>
        </Providers>
      </body>
    </html>
  );
}
