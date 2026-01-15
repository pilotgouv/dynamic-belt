import { prisma } from "@/lib/prisma";
import { UserSettings } from "@/types/data";
import { BusinessEngine } from "@/lib/engine";

export interface ReportConfig {
    metrics: string[]; // ['revenue_gross', 'profit_estimated', 'spend', 'sessions']
    dimensions: string[]; // ['date'] (default), ['channel'], ['product']
    filters?: Record<string, any>;
}

export interface ReportResult {
    summary: Record<string, number | string>;
    series: any[];
    confidence: 'EXACT' | 'ESTIMATED' | 'INCOMPLETE';
    confidenceReasons: string[];
    context?: any;
}

export class ReportService {

    static async runReport(
        organizationId: string,
        config: ReportConfig,
        range: { start: Date, end: Date, granularity: 'day' | 'week' | 'month' }
    ): Promise<ReportResult> {

        // 1. Fetch Settings for Calculations
        const settingsRecord = await prisma.settings.findUnique({ where: { organizationId } });
        const settings: UserSettings = {
            currency: (settingsRecord?.currency as any) || 'EUR',
            costProfile: {
                platformFeesPercent: settingsRecord?.platformFeesPercent || 2.9,
                shippingCostAvg: settingsRecord?.shippingCostAvg || 0,
                returnRatePercent: settingsRecord?.returnRatePercent || 0,
                cogsEsitmatedPercent: settingsRecord?.cogsEstimatedPercent || 40,
            },
            targets: { minRoas: 2.5, minMargin: 20 }
        };

        // 2. Fetch Data Sources based on requested metrics
        // Simple implementation: Fetch ALL daily data for the range and aggregate in memory.
        // For Scale: This should be optimized to SQL aggregations.

        const financeData = await prisma.financeDaily.findMany({
            where: { organizationId, date: { gte: range.start, lte: range.end } }
        });

        const adsData = await prisma.adsDaily.findMany({
            where: { organizationId, date: { gte: range.start, lte: range.end } }
        });

        // Traffic data fetch (safe even if empty)
        const trafficData = await prisma.trafficDaily.findMany({
            where: { organizationId, date: { gte: range.start, lte: range.end } }
        });

        // 3. Aggregate
        const aggregated = new Map<string, any>();

        // Helper to get key based on granularity
        // Helper to get key based on granularity
        const getKey = (date: Date) => {
            if (range.granularity === 'month') {
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            if (range.granularity === 'week') {
                const d = new Date(date);
                const day = d.getDay();
                const diff = d.getDate() - day + (day == 0 ? -6 : 1); // Adjust when day is Sunday
                const weekStart = new Date(d.setDate(diff));
                return weekStart.toISOString().split('T')[0];
            }
            return date.toISOString().split('T')[0]; // Default Day
        };

        // ... Aggregation Logic ...
        // We will build a unified timeline since most reports are time-series based.

        const allDates = new Set<string>();
        financeData.forEach(r => allDates.add(getKey(r.date)));
        adsData.forEach(r => allDates.add(getKey(r.date)));
        trafficData.forEach(r => allDates.add(getKey(r.date)));

        // Product Data Fetch (Safe)
        let productData: any[] = [];
        if (config.dimensions.includes('product_name') || config.dimensions.includes('sku')) {
            productData = await prisma.productDaily.findMany({
                where: { organizationId, date: { gte: range.start, lte: range.end } }
            });
        }

        // Special Case: Product Dimension aggregation
        if (config.dimensions.includes('product_name') || config.dimensions.includes('sku')) {
            const productMap = new Map<string, any>();
            productData.forEach(p => {
                const key = p.name;
                const curr = productMap.get(key) || { name: key, revenue: 0, units: 0 };
                productMap.set(key, {
                    name: key,
                    revenue: curr.revenue + p.revenue,
                    units: curr.units + p.unitsSold,
                    sku: p.sku
                });
            });

            const productSeries = Array.from(productMap.values()).map(p => {
                // Simple Categorization Logic (Mock-ish but logic flows)
                let status = 'Standard';
                if (p.revenue > 1000) status = 'Hero';
                else if (p.units > 50 && p.revenue < 500) status = 'Volume';
                else if (p.units === 0) status = 'Sleeper';

                return {
                    date: p.name, // Mapping Name to Date for View compatibility (Table treats first col as Date/Key)
                    product_name: p.name,
                    revenue_gross: p.revenue,
                    revenue_net: p.revenue, // Assuming no COGS data specific yet
                    units_sold: p.units,
                    spend: 0, // No attribution yet
                    profit_estimated: p.revenue * 0.4, // Est 40% margin default
                    margin_percent: 40,
                    status: status,
                    refunds: 0
                };
            }).sort((a, b) => b.revenue_gross - a.revenue_gross);

            // Summaries for Products
            const totalRev = productSeries.reduce((a, b) => a + b.revenue_gross, 0);
            return {
                summary: {
                    total_revenue: totalRev,
                    total_spend: 0,
                    total_profit: totalRev * 0.4,
                    global_margin: 40
                },
                series: productSeries,
                confidence: 'ESTIMATED',
                confidenceReasons: ['Product Profit estimated at 40% default']
            };
        }

        // Special Case: Channel Dimension aggregation (Ads)
        if (config.dimensions.includes('channel')) {
            const channelMap = new Map<string, any>();
            adsData.forEach(a => {
                const key = a.channel;
                const curr = channelMap.get(key) || {
                    channel: key, spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0
                };
                channelMap.set(key, {
                    channel: key,
                    spend: curr.spend + a.spend,
                    revenue: curr.revenue + a.conversionValue,
                    impressions: curr.impressions + a.impressions,
                    clicks: curr.clicks + a.clicks,
                    conversions: curr.conversions + a.conversions
                });
            });

            const channelSeries = Array.from(channelMap.values()).map(c => {
                // Estimate Contribution
                // Gross Margin = Rev * (1 - (cogs% / 100))
                const estMarginPercent = 100 - settings.costProfile.cogsEsitmatedPercent;
                const grossMargin = c.revenue * (estMarginPercent / 100);
                const contribution = grossMargin - c.spend;

                return {
                    date: c.channel, // Key for Table
                    channel: c.channel,
                    spend: c.spend,
                    revenue: c.revenue,
                    impressions: c.impressions,
                    clicks: c.clicks,
                    conversions: c.conversions,
                    ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
                    cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
                    roas: c.spend > 0 ? c.revenue / c.spend : 0,
                    cpa: c.conversions > 0 ? c.spend / c.conversions : 0,
                    contribution: contribution, // "Profit" contribution
                    contribution_margin: c.revenue > 0 ? (contribution / c.revenue) * 100 : 0
                };
            }).sort((a, b) => b.spend - a.spend);

            // Summaries for Channels
            const totalSpend = channelSeries.reduce((a, b) => a + b.spend, 0);
            const totalRev = channelSeries.reduce((a, b) => a + b.revenue, 0);
            const totalContrib = channelSeries.reduce((a, b) => a + b.contribution, 0);

            return {
                summary: {
                    total_revenue: totalRev,
                    total_spend: totalSpend,
                    total_profit: totalContrib, // Contextual profit
                    roas: totalSpend > 0 ? totalRev / totalSpend : 0
                },
                series: channelSeries,
                confidence: 'ESTIMATED',
                confidenceReasons: ['Contribution uses global COGS estimate']
            };
        }
        // Fetch Top 3 Products & Channels regardless of report type
        const topProductsRaw = await prisma.productDaily.groupBy({
            by: ['name', 'sku'],
            where: { organizationId, date: { gte: range.start, lte: range.end } },
            _sum: { revenue: true, unitsSold: true, profitEstimated: true },
            orderBy: { _sum: { revenue: 'desc' } },
            take: 5
        });

        const topChannelsRaw = await prisma.adsDaily.groupBy({
            by: ['channel'],
            where: { organizationId, date: { gte: range.start, lte: range.end } },
            _sum: { spend: true, conversionValue: true },
            orderBy: { _sum: { spend: 'desc' } },
            take: 3
        });

        const context = {
            heroProducts: topProductsRaw.map(p => ({
                name: p.name,
                sku: p.sku,
                revenue: p._sum.revenue || 0,
                units: p._sum.unitsSold || 0,
                profit_estimated: p._sum.profitEstimated || (p._sum.revenue || 0) * 0.4 // Fallback to 40% if no real data
            })),
            topChannels: topChannelsRaw.map(c => ({
                channel: c.channel,
                spend: c._sum.spend || 0,
                revenue: c._sum.conversionValue || 0,
                roas: c._sum.spend ? (c._sum.conversionValue || 0) / c._sum.spend : 0
            }))
        };

        const series = Array.from(allDates).sort().map(dateKey => {
            // Find records matching this bucket
            // Note: This is an approximation for day bucket. For week/month we need better filtering.
            // Assuming 'day' for MVP V2.5.0

            // Filter raw rows belonging to this bucket
            const fRows = financeData.filter(d => getKey(d.date) === dateKey); // This works for day
            const aRows = adsData.filter(d => getKey(d.date) === dateKey);
            const tRows = trafficData.filter(d => getKey(d.date) === dateKey);

            // Sums
            const revenue = fRows.reduce((a, b) => a + b.revenueGross, 0);
            const refunds = fRows.reduce((a, b) => a + b.refundsValue, 0);
            const orders = fRows.reduce((a, b) => a + b.ordersCount, 0);
            const spend = aRows.reduce((a, b) => a + b.spend, 0);
            const sessions = tRows.reduce((a, b) => a + b.sessions, 0);

            // Engine Calc
            const profitMetrics = BusinessEngine.calculateProfit(revenue, refunds, spend, orders, settings);

            return {
                date: dateKey,
                revenue_gross: revenue,
                refunds: refunds,
                revenue_net: profitMetrics.revenueNet,
                cogs: profitMetrics.costOfGoods,
                fees: profitMetrics.transactionFees,
                shipping: profitMetrics.shippingCost,
                spend: spend,
                profit_estimated: profitMetrics.profitEstimated,
                margin_percent: profitMetrics.profitMarginPercent,
                sessions: sessions,
                roas: spend > 0 ? revenue / spend : 0,
                orders: orders
            };
        });

        // 4. Summaries
        const totalRevenue = series.reduce((a, b) => a + (b.revenue_gross || 0), 0);
        const totalRefunds = series.reduce((a, b) => a + (b.refunds || 0), 0);
        const totalRevenueNet = series.reduce((a, b) => a + (b.revenue_net || 0), 0);
        const totalCogs = series.reduce((a, b) => a + (b.cogs || 0), 0);
        const totalSpend = series.reduce((a, b) => a + (b.spend || 0), 0);
        const totalProfit = series.reduce((a, b) => a + (b.profit_estimated || 0), 0);

        const globalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const globalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

        // Calculate PILOT Score
        const pilotHealth = BusinessEngine.calculateHealthScore({
            marginPercent: globalMargin,
            roas: globalRoas,
            profit: totalProfit,
            spend: totalSpend
        }, settings.targets);

        return {
            summary: {
                total_revenue: totalRevenue,
                total_revenue_net: totalRevenueNet,
                total_refunds: totalRefunds,
                total_cogs: totalCogs,
                total_spend: totalSpend,
                total_profit: totalProfit,
                global_margin: globalMargin,
                roas: globalRoas,
                pilot_score: pilotHealth.score,
                pilot_status: pilotHealth.status,
                pilot_components: pilotHealth.components
            },
            series,
            context,
            confidence: 'ESTIMATED', // Logic to refine later
            confidenceReasons: ['COGS uses global estimate', 'Shipping costs averaged']
        };
    }
}
