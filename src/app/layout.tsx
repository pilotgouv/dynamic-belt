import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Use Inter for premium, corporate look
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <Providers>
          <AppProvider>
            <Sidebar />
            <main style={{ marginLeft: "250px", width: "calc(100% - 250px)", minHeight: "100vh", padding: "2rem" }}>
              {children}
            </main>
          </AppProvider>
        </Providers>
      </body>
    </html>
  );
}
