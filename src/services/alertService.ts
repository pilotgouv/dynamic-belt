import { prisma } from "@/lib/prisma";

export class AlertService {

    /**
     * Analyzes daily data to generate actionable alerts.
     * Call this after a successful Sync.
     */
    static async generateDailyAlerts(organizationId: string, date: Date) {

        // Fetch synchronized data for the day
        const finance = await prisma.financeDaily.findUnique({
            where: { organizationId_date: { organizationId, date } }
        });

        // We aggregate traffic across all sources/mediums for high-level checks
        const trafficRecords = await prisma.trafficDaily.findMany({
            where: { organizationId, date }
        });

        const totalSessions = trafficRecords.reduce((sum, t) => sum + t.sessions, 0);
        // const totalUsers = trafficRecords.reduce((sum, t) => sum + t.users, 0);

        // --- RULE 1: Economic Integrity (Data Gap) ---
        // If we have significant revenue but zero traffic, tracking is likely broken.
        if (finance?.revenueGross && finance.revenueGross > 100 && totalSessions === 0) {
            await this.createAlert(
                organizationId,
                'critical',
                'finance',
                'Data Integrity Alert: Revenue recorded without corresponding traffic. Check your GA4 tracking.'
            );
        }

        // --- RULE 2: Traffic Quality (Empty Calorie Traffic) ---
        // High traffic but very low conversion rate.
        if (totalSessions > 500) {
            const orders = finance?.ordersCount || 0;
            const conversionRate = orders / totalSessions; // 0.02 = 2%

            if (conversionRate < 0.005) { // < 0.5%
                await this.createAlert(
                    organizationId,
                    'warning',
                    'traffic',
                    `Low Conversion Rate (${(conversionRate * 100).toFixed(2)}%) detected despite significant traffic volume.`
                );
            }
        }

        // --- RULE 3: Channel Arbitrage (V2.4) ---
        // Identify channels burning cash vs those driving profit.

        const settingsRecord = await prisma.settings.findUnique({
            where: { organizationId }
        });

        // Construct a UserSettings object (partial for now is fine for our usage if we respect types)
        // Ideally we fetch full relation in a real Clean Architecture but for speed:
        if (settingsRecord) {
            const settings: any = {
                costProfile: {
                    cogsEsitmatedPercent: settingsRecord.cogsEstimatedPercent || 40
                    // other fields not critical for this specific check
                }
            };

            const adsRecords = await prisma.adsDaily.findMany({
                where: { organizationId, date }
            });

            if (adsRecords.length > 0) {
                // Import BusinessEngine inside method to avoid circular dep if needed, or assume it's available
                const { BusinessEngine } = await import('@/lib/engine');

                const arbitrage = BusinessEngine.analyzeChannelArbitrage(
                    adsRecords as any, // Cast to match interface if needed
                    finance?.revenueGross || 0,
                    settings
                );

                for (const row of arbitrage) {
                    if (row.status === 'subsidized') {
                        await this.createAlert(
                            organizationId,
                            'warning',
                            'ads',
                            `Channel Subsidization Detected: ${row.channel} is unprofitable (Contribution: ${row.contribution.toFixed(2)}€). It is being paid for by other channels.`
                        );
                    }
                }

                // Check for "Good ROAS but Negative Profit" edge case if COGS are high
                // This is covered by 'contribution < 0' implicitly in 'subsidized' status if logic aligns.
            }
        }
    }

    static async createAlert(organizationId: string, type: string, category: string, message: string) {
        // Prevent spamming the same alert for the same day/issue if unread
        const existing = await prisma.alert.findFirst({
            where: {
                organizationId,
                message,
                isRead: false
            }
        });

        if (!existing) {
            await prisma.alert.create({
                data: {
                    organizationId,
                    type,
                    category,
                    message,
                    createdAt: new Date(),
                    isRead: false
                }
            });
        }
    }
}
