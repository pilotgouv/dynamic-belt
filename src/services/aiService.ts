import { prisma } from "@/lib/prisma";
import { BusinessEngine } from "@/lib/engine";

export class AiService {

    /**
     * V2.4 - Arbitrage Mode
     * Generates a dynamic analysis of channel profitability vs volume.
     */
    static async generateDailyBriefing(organizationId: string, date: Date): Promise<string> {

        // Fetch data
        // Fetch data (Aggregated from all channels)
        const finances = await prisma.financeDaily.findMany({
            where: { organizationId, date }
        });

        const ads = await prisma.adsDaily.findMany({
            where: { organizationId, date }
        });

        const settingsRecord = await prisma.settings.findUnique({ where: { organizationId } });
        if (finances.length === 0 || !settingsRecord) {
            return "Données insuffisantes pour l'analyse IA ce matin.";
        }

        // Aggregate Finance
        const finance = {
            revenueGross: finances.reduce((sum, f) => sum + f.revenueGross, 0),
            marginPercent: 0 // calc below
        };
        const profitTotal = finances.reduce((sum, f) => sum + f.profitEstimated, 0);
        finance.marginPercent = finance.revenueGross > 0 ? (profitTotal / finance.revenueGross) * 100 : 0;

        const settings: any = {
            estimateCogsFallback: settingsRecord.estimateCogsFallback || 40,
            costProfile: {
                // shim for legacy engine calls if needed inside analyzeChannelArbitrage
                cogsEstimatedPercent: settingsRecord.estimateCogsFallback || 40
            }
        };

        // Run Arbitrage Analysis
        const arbitrage = BusinessEngine.analyzeChannelArbitrage(
            ads as any,
            finance.revenueGross || 0,
            settings
        );

        // Generate Narrative
        let narrative = `Votre chiffre d'affaires est de ${finance.revenueGross.toFixed(0)}€ avec une marge globale de ${finance.marginPercent.toFixed(1)}%. `;

        // Find best and worst channels
        const profitable = arbitrage.filter(c => c.status === 'profitable');
        const subsidized = arbitrage.filter(c => c.status === 'subsidized');

        if (subsidized.length > 0) {
            const worst = subsidized.sort((a, b) => a.contribution - b.contribution)[0]; // Lowest contribution (most negative)
            narrative += `Attention : Le canal ${worst.channel} est en perte sèche (Contribution: ${worst.contribution.toFixed(0)}€). Il dilue la rentabilité générée par vos autres canaux. `;
        } else if (profitable.length > 0) {
            const best = profitable.sort((a, b) => b.contribution - a.contribution)[0];
            narrative += `Excellente performance sur ${best.channel} qui tire la croissance aujourd'hui. `;
        }

        if (subsidized.length > 0 && profitable.length > 0) {
            narrative += "Conseil : Envisagez de réallouer 15-20% du budget des canaux déficitaires vers les canaux profitables pour augmenter votre marge nette immédiate.";
        }

        return narrative;
    }
}
