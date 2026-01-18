
import { prisma } from "@/lib/prisma";
import { BusinessEngine } from "@/lib/engine";

export class PilotService {

    /**
     * Aggregates data and calculates the PILOT Score for a specific period.
     * Persists the result in PilotScoreDaily table.
     */
    static async generateScore(organizationId: string, range: { start: Date, end: Date }) {

        // 1. Fetch Finance Stats (Current Period)
        const financeAgg = await prisma.financeDaily.aggregate({
            where: {
                organizationId,
                date: { gte: range.start, lte: range.end }
            },
            _sum: {
                revenueGross: true,
                revenueNet: true,
                profitEstimated: true,
                refundsValue: true
            }
        });

        const finance = {
            revenueGross: financeAgg._sum.revenueGross || 0,
            revenueNet: financeAgg._sum.revenueNet || 0,
            profitReal: financeAgg._sum.profitEstimated || 0,
            refunds: financeAgg._sum.refundsValue || 0
        };

        // 2. Fetch Finance Stats (Previous Period)
        // Calculate previous range
        const duration = range.end.getTime() - range.start.getTime();
        const prevEnd = new Date(range.start.getTime() - 24 * 60 * 60 * 1000); // Day before start
        const prevStart = new Date(prevEnd.getTime() - duration);

        const prevFinanceAgg = await prisma.financeDaily.aggregate({
            where: {
                organizationId,
                date: { gte: prevStart, lte: prevEnd }
            },
            _sum: {
                revenueNet: true,
                profitEstimated: true
            }
        });

        const trend = {
            revenueNetCurrent: finance.revenueNet,
            revenueNetPrev: prevFinanceAgg._sum.revenueNet || 0,
            profitRealCurrent: finance.profitReal,
            profitRealPrev: prevFinanceAgg._sum.profitEstimated || 0
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
        // Get total profit (we have it in finance.profitReal, but let's trust ProductDaily aggregation for item-level profit)
        // Actually ProductDaily.profitEstimated is a good proxy.
        const topProduct = await prisma.productDaily.groupBy({
            by: ['sku'],
            where: { organizationId, date: { gte: range.start, lte: range.end } },
            _sum: { profitEstimated: true },
            orderBy: { _sum: { profitEstimated: 'desc' } },
            take: 1
        });

        const topProfit = topProduct[0]?._sum?.profitEstimated || 0;
        const totalProfitProxy = Math.max(finance.profitReal, 1); // Avoid div by zero
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

        // 5. Data Completeness
        const connections = await prisma.connection.findMany({
            where: { organizationId, status: 'ACTIVE' },
            select: { tags: true, provider: true }
        });

        const connectedTypes = new Set<string>(connections.flatMap(c => (c.tags as string[]) || []));

        // Robust Fallback Mapping (Reference engine.ts expectation: 'sales', 'ads', 'traffic')
        connections.forEach(c => {
            if (['woocommerce', 'shopify', 'amazon_seller'].includes(c.provider)) connectedTypes.add('sales');
            if (['google_ads', 'meta_ads', 'tiktok_ads'].includes(c.provider)) connectedTypes.add('ads');
            if (['ga4'].includes(c.provider)) connectedTypes.add('traffic');
        });

        const connectedTypesArray = Array.from(connectedTypes);
        // Map common provider names to tags if tags aren't populated strictly
        // For robustness, check providers too if needed, but sticking to logic.
        // Assuming tags are populated like ['sales', 'ads'].

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
