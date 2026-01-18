
import { prisma } from "@/lib/prisma";
import { BusinessEngine, DEFAULT_SETTINGS } from "@/lib/engine";

export class PilotService {

    /**
     * Aggregates data and calculates the PILOT Score for a specific period.
     * Persists the result in PilotScoreDaily table.
     */
    static async generateScore(organizationId: string, range: { start: Date, end: Date }) {

        // 0. Fetch Settings for accurate PnL
        const settingsRecord = await prisma.settings.findFirst({ where: { organizationId } }); // Correct table name

        // Merge defaults
        const settings = {
            ...DEFAULT_SETTINGS,
            ...settingsRecord, // Overrides defaults with DB values
            // Ensure boolean fields are boolean (DB might be null if optional, but schema has defaults)
            socialChargesEnabled: settingsRecord?.socialChargesEnabled ?? false,
            socialChargesPercent: settingsRecord?.socialChargesPercent ?? 0,
            incomeTaxEnabled: settingsRecord?.incomeTaxEnabled ?? false,
            incomeTaxPercent: settingsRecord?.incomeTaxPercent ?? 0,
        } as any; // Cast to any or UserSettings to avoid strict type mismatch on mismatching ID fields or similar

        // 1. Fetch Finance Stats (Current Period) - Aggregate components for Real Calculation
        const financeAgg = await prisma.financeDaily.aggregate({
            where: {
                organizationId,
                date: { gte: range.start, lte: range.end }
            },
            _sum: {
                revenueGross: true,
                revenueNet: true,
                profitEstimated: true, // Legacy
                refundsValue: true,
                cogs: true,           // CORRECT FIELD
                adSpendTotal: true,   // CORRECT FIELD
                shippingCost: true,   // CORRECT FIELD
                fees: true,           // CORRECT FIELD
                ordersCount: true
            }
        });

        // Use FinancialEngine to calculate Real Profit (aligned with Dashboard)
        const { profit: profitReal } = BusinessEngine.calculatePnL_SimpleForPilot(
            {
                revenueGross: financeAgg._sum.revenueGross || 0,
                revenueNet: financeAgg._sum.revenueNet || 0,
                cogs: financeAgg._sum.cogs || 0,
                adSpend: financeAgg._sum.adSpendTotal || 0,
                ordersCount: financeAgg._sum.ordersCount || 0,
                shipping: financeAgg._sum.shippingCost || 0,
                fees: financeAgg._sum.fees || 0
            },
            settings
        );

        const finance = {
            revenueGross: financeAgg._sum.revenueGross || 0,
            revenueNet: financeAgg._sum.revenueNet || 0,
            profitReal: profitReal, // Use calculated profit
            refunds: financeAgg._sum.refundsValue || 0
        };

        // 2. Fetch Finance Stats (Previous Period)
        const duration = range.end.getTime() - range.start.getTime();
        const prevEnd = new Date(range.start.getTime() - 24 * 60 * 60 * 1000);
        const prevStart = new Date(prevEnd.getTime() - duration);

        const prevFinanceAgg = await prisma.financeDaily.aggregate({
            where: {
                organizationId,
                date: { gte: prevStart, lte: prevEnd }
            },
            _sum: {
                revenueGross: true,
                revenueNet: true,
                cogs: true,
                adSpendTotal: true,
                shippingCost: true,
                fees: true,
                ordersCount: true
            }
        });

        const { profit: profitRealPrev } = BusinessEngine.calculatePnL_SimpleForPilot(
            {
                revenueGross: prevFinanceAgg._sum.revenueGross || 0,
                revenueNet: prevFinanceAgg._sum.revenueNet || 0,
                cogs: prevFinanceAgg._sum.cogs || 0,
                adSpend: prevFinanceAgg._sum.adSpendTotal || 0,
                ordersCount: prevFinanceAgg._sum.ordersCount || 0,
                shipping: prevFinanceAgg._sum.shippingCost || 0,
                fees: prevFinanceAgg._sum.fees || 0
            },
            settings
        );

        const trend = {
            revenueNetCurrent: finance.revenueNet,
            revenueNetPrev: prevFinanceAgg._sum.revenueNet || 0,
            profitRealCurrent: profitReal,
            profitRealPrev: profitRealPrev
        };

        // 3. Fetch Ads Stats (Current)
        const adsAgg = await prisma.adsDaily.aggregate({
            where: {
                organizationId,
                date: { gte: range.start, lte: range.end }
            },
            _sum: {
                spend: true,
                conversionValue: true
            }
        });

        const ads = {
            spend: adsAgg._sum.spend || 0,
            attributedRevenue: adsAgg._sum.conversionValue || 0
        };

        // 4. Risk Analysis (Concentration)
        // A. Product Concentration
        const topProduct = await prisma.productDaily.groupBy({
            by: ['sku'],
            where: { organizationId, date: { gte: range.start, lte: range.end } },
            _sum: { profitEstimated: true },
            orderBy: { _sum: { profitEstimated: 'desc' } },
            take: 1
        });

        const topProfit = topProduct[0]?._sum?.profitEstimated || 0;
        const totalProfitProxy = Math.max(finance.profitReal, 1);
        const topSkuProfitShare = (topProfit / totalProfitProxy) * 100;

        // B. Channel Concentration
        const channelStats = await prisma.financeDaily.groupBy({
            by: ['channel'],
            where: { organizationId, date: { gte: range.start, lte: range.end } },
            _sum: { revenueGross: true },
            orderBy: { _sum: { revenueGross: 'desc' } },
            take: 1
        });

        const topChannelRev = channelStats[0]?._sum?.revenueGross || 0;
        const totalRevProxy = Math.max(finance.revenueGross, 1);
        const topChannelRevenueShare = (topChannelRev / totalRevProxy) * 100;

        // C. Refund Rate
        const refundsRate = finance.revenueGross > 0 ? (finance.refunds / finance.revenueGross) * 100 : 0;

        const risk = {
            topSkuProfitShare,
            topChannelRevenueShare,
            refundsRate
        };

        // 5. Data Completeness - Relaxed (Any status)
        const connections = await prisma.connection.findMany({
            where: { organizationId }, // Removed status filter
            select: { tags: true, provider: true }
        });

        const connectedTypes = new Set<string>(connections.flatMap(c => (c.tags as string[]) || []));

        // Robust Fallback Mapping
        connections.forEach(c => {
            const p = c.provider.toLowerCase(); // Handle Enum Case
            if (['woocommerce', 'shopify', 'amazon_seller'].includes(p)) connectedTypes.add('sales');
            if (['google_ads', 'meta_ads', 'tiktok_ads'].includes(p)) connectedTypes.add('ads');
            if (['ga4'].includes(p)) connectedTypes.add('traffic');
        });

        const connectedTypesArray = Array.from(connectedTypes);

        // 6. Calculate Score
        const pilotScore = BusinessEngine.calculatePilotScoreV2({
            finance,
            trend,
            ads,
            risk,
            data: { connectedTypes: connectedTypesArray }
        });

        // 7. Persist
        // We delete existing score for this exact range/date?
        // Or create new entry.
        // For MVP, simplistic: Create entry valid for Today.

        // Usually we run this Daily for "Yesterday" or "Last 30 Days".
        // Let's assume this is "Today's assessment of [Range]".
        const today = new Date();

        await prisma.pilotScoreDaily.create({
            data: {
                orgId: organizationId,
                date: today,
                periodStart: range.start,
                periodEnd: range.end,
                scoreTotal: pilotScore.scoreTotal,
                breakdown: pilotScore.breakdown as any, // Json compatible
                reasons: pilotScore.reasons,
                actions: pilotScore.actions
            }
        });

        return pilotScore;
    }
}
