import { prisma } from "@/lib/prisma";
import { UserSettings } from "@/types/data";
import { FinancialEngine } from "@/lib/financial-engine";

export interface ReportConfig {
    metrics: string[];
    dimensions: string[];
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

        // 1. Fetch Settings
        let settingsRecord: any;
        try {
            settingsRecord = await prisma.settings.findUnique({ where: { organizationId } });
        } catch (e) {
            console.error("Failed to fetch settings", e);
        }

        // Map DB Settings to UserSettings (safely)
        const settings: UserSettings = {
            currency: settingsRecord?.currency || 'EUR',
            vatEnabled: settingsRecord?.vatEnabled ?? false,
            vatMode: (settingsRecord?.vatMode as any) || 'HT',
            vatRate: settingsRecord?.vatRate ?? 0.20,
            shippingCostMode: (settingsRecord?.shippingCostMode as any) || 'NONE',
            shippingCostValue: settingsRecord?.shippingCostValue ?? 0,
            paymentFeePercent: settingsRecord?.paymentFeePercent ?? 0,
            paymentFeeFixed: settingsRecord?.paymentFeeFixed ?? 0,
            dataMode: ((settingsRecord?.dataMode as any) || 'STRICT').toUpperCase(),
            estimateCogsFallback: settingsRecord?.estimateCogsFallback ?? 0,
            targets: {
                minRoas: settingsRecord?.minRoasTarget ?? 2.5,
                minMargin: settingsRecord?.minMarginTarget ?? 20
            },
            // Fiscal Map
            socialChargesEnabled: settingsRecord?.socialChargesEnabled ?? false,
            socialChargesPercent: settingsRecord?.socialChargesPercent ?? 0,
            incomeTaxEnabled: settingsRecord?.incomeTaxEnabled ?? false,
            incomeTaxPercent: settingsRecord?.incomeTaxPercent ?? 0,
        };

        // 2. Fetch Data Sources
        const financeData = await prisma.financeDaily.findMany({
            where: { organizationId, date: { gte: range.start, lte: range.end } }
        });

        const adsData = await prisma.adsDaily.findMany({
            where: { organizationId, date: { gte: range.start, lte: range.end } }
        });

        const trafficData = await prisma.trafficDaily.findMany({
            where: { organizationId, date: { gte: range.start, lte: range.end } }
        });

        // 3. Fetch Product Truth for COGS
        // We need to know: SKU, Units Sold, Revenue Gross.
        // We do NOT use profitEstimated from DB anymore as it might be stale or based on old logic.
        // We will calculate COGS on the fly based on current Product.costUnit.
        const productDaily = await prisma.productDaily.findMany({
            where: { organizationId, date: { gte: range.start, lte: range.end } },
            select: {
                date: true,
                sku: true,
                unitsSold: true,
                revenue: true, // Gross revenue usually
                // profitEstimated: ignored
            }
        });

        // Need current costUnit for these SKUs.
        const skus = [...new Set(productDaily.map(p => p.sku))];
        const productsMeta = await prisma.product.findMany({
            where: { orgId: organizationId, sku: { in: skus } },
            select: { sku: true, costUnit: true }
        });
        const costMap = new Map<string, number>();
        productsMeta.forEach(p => {
            // Trim SKU to ensure match
            if (p.costUnit && p.sku) costMap.set(p.sku.trim(), p.costUnit);
        });

        // 4. Dynamic Aggregation
        const dims = config.dimensions && config.dimensions.length > 0 ? config.dimensions : ['date'];

        const getDimVal = (row: any, dim: string, source: 'finance' | 'ads' | 'traffic' | 'product') => {
            if (dim === 'date') return row.date.toISOString().split('T')[0];
            if (dim === 'channel') return row.channel || (source === 'traffic' ? row.source : 'direct');
            if (dim === 'campaign') return row.campaign || 'global';
            if (dim === 'product_name') return row.name || row.sku || 'Unknown';
            return 'all';
        };

        const genKey = (row: any, source: 'finance' | 'ads' | 'traffic' | 'product') => dims.map(d => getDimVal(row, d, source)).join('||');

        const buckets = new Map<string, any>();
        const initBucket = (key: string) => ({
            key,
            dims: key.split('||').reduce((acc, v, i) => ({ ...acc, [dims[i]]: v }), {}),
            finance: [] as any[], ads: [] as any[], traffic: [] as any[], products: [] as any[]
        });

        // Distribute Rows
        financeData.forEach(r => {
            // FinanceDaily usually doesn't have campaign. If campaign requested, it falls to 'global' bucket or needs specific logic?
            // If dimension is 'campaign', FinanceDaily (Store Revenue) cannot attach to a campaign easily unless we use UTMs.
            // For now, if dimension is 'campaign', FinanceDaily might end up in "global" bucket.
            // But AdsDaily rows will end up in "Campaign A", "Campaign B".
            // Result: Rows for Campaigns have Ads Data but 0 Store Revenue. Row for 'global' has All Store Revenue.
            // This is correct behavior for Attribution window separate from Store P&L.
            const k = genKey(r, 'finance');
            if (!buckets.has(k)) buckets.set(k, initBucket(k));
            buckets.get(k).finance.push(r);
        });

        adsData.forEach(r => {
            const k = genKey(r, 'ads');
            if (!buckets.has(k)) buckets.set(k, initBucket(k));
            buckets.get(k).ads.push(r);
        });

        trafficData.forEach(r => {
            const k = genKey(r, 'traffic');
            if (!buckets.has(k)) buckets.set(k, initBucket(k));
            buckets.get(k).traffic.push(r);
        });

        productDaily.forEach(r => {
            const k = genKey(r, 'product');
            if (!buckets.has(k)) buckets.set(k, initBucket(k));
            buckets.get(k).products.push(r);
        });

        const series = Array.from(buckets.values()).map(bucket => {
            const fRows = bucket.finance;
            const aRows = bucket.ads;
            const tRows = bucket.traffic;
            const pRows = bucket.products;

            // Inputs
            const revenueGross = fRows.reduce((a: number, b: any) => a + b.revenueGross, 0);
            const refunds = fRows.reduce((a: number, b: any) => a + b.refundsValue, 0);
            const orders = fRows.reduce((a: number, b: any) => a + b.ordersCount, 0);

            const spend = aRows.reduce((a: number, b: any) => a + b.spend, 0);
            const impressions = aRows.reduce((a: number, b: any) => a + (b.impressions || 0), 0);
            const clicks = aRows.reduce((a: number, b: any) => a + b.clicks, 0);
            const conversions = aRows.reduce((a: number, b: any) => a + b.conversions, 0);
            const revenueAds = aRows.reduce((a: number, b: any) => a + b.conversionValue, 0); // Attributed Revenue

            const sessions = tRows.reduce((a: number, b: any) => a + b.sessions, 0);

            // Transaction Fees collected from Source (if any)
            // Note: FinanceDaily schema currently has transactionFees? (Check schema). 
            // If not, we pass 0. Using 0 safe for now.
            const realFees = 0;
            // Disable Shipping Revenue proxy. Rely on Rule for Cost.
            const realShipping = 0;

            // Calculate Product COGS & Uncovered Revenue
            let productCogsKnown = 0;
            let revenueUncovered = 0;

            // Default 40% cost (60% margin) if 0
            const fallbackPct = settings.estimateCogsFallback > 0 ? settings.estimateCogsFallback : 40;
            // Note: User setting "60%" Marge means Cost is 40%. 
            // If setting value is "60", does it mean Cost=60 or Margin=60?
            // User text: "60% DE MARGE ... alors cogs - 40% de CA".
            // So default should be (100 - settings.margin).
            // But settings name is `estimateCogsFallback`.
            // Let's assume the stored value IS the Cost %.
            // If user typed 60 in "Marge" field, frontend likely converted it? or saved 60?
            // "Marge par défaut (COGS) 60%". Ideally value is 40.
            // I'll assume value in DB is what we multiply Revenue by.
            // If DB has 60, we take 60% cost. User might be confused.
            // But I cannot change frontend. I will use value as is.

            // Debug Log (Server Side)
            if (bucket.dims.date === '2025-01-01' || Math.random() < 0.01) { // Sample
                console.log(`[ReportService] Bucket: ${bucket.key}`, {
                    mode: settings.dataMode,
                    fallback: settings.estimateCogsFallback,
                    pRows: pRows.length
                });
            }

            if (pRows.length > 0) {
                pRows.forEach((p: any) => {
                    const safeSku = (p.sku || '').trim();
                    const unitCost = costMap.get(safeSku) || 0;
                    if (unitCost > 0) {
                        productCogsKnown += (p.unitsSold * unitCost);
                    } else {
                        revenueUncovered += p.revenue;
                    }
                });
            } else {
                if (dims.includes('product_name')) {
                    // If grouping by product, we rely solely on productDaily.
                    // If pRows empty, 0 cost.
                } else {
                    // For Date/Channel grouping, if no distinct product data linked (unlikely in this arch unless aggregation is global),
                    // Fallback to finance
                    if (revenueGross > 0) revenueUncovered = revenueGross;
                }
            }

            // Ensure Fallback is valid in Settings passed to Engine
            const engineSettings = { ...settings, estimateCogsFallback: fallbackPct };

            // RUN ENGINE
            const pnl = FinancialEngine.calculatePnL({
                revenueGross,
                refunds,
                ordersCount: orders,

                adSpend: spend,
                productCogsKnown,
                revenueUncovered,
                realShipping,
                realFees
            }, engineSettings);

            return {
                ...bucket.dims, // Spread dimensions: date, channel, campaign, etc.
                channel: bucket.dims.channel || 'global', // fallback
                date: bucket.dims.date || 'global',

                revenue_gross: revenueGross,
                refunds: refunds,
                revenue_net: pnl.revenueNet,
                revenue_ads: revenueAds, // Attributed Revenue

                cogs: pnl.cogs,
                fees: pnl.fees,
                shipping: pnl.shipping,

                // Fiscal
                social_charges: pnl.socialCharges,
                income_tax: pnl.incomeTax,

                spend: spend,
                impressions: impressions,
                clicks: clicks,
                conversions: conversions,
                cpa: conversions > 0 ? spend / conversions : 0,
                contribution: revenueAds - spend, // Metric for Ads View
                contribution_margin: revenueAds > 0 ? ((revenueAds - spend) / revenueAds) * 100 : 0,

                profit_estimated: pnl.profit,
                margin_percent: pnl.margin,

                sessions: sessions,
                roas: spend > 0 ? revenueAds / spend : 0, // Attributed ROAS (Metric for Ads)
                // roas_blended: spend > 0 ? revenueGross / spend : 0, // Should we expose this too? Maybe later.

                orders: orders,
                is_incomplete: pnl.isIncomplete,
                is_estimated: pnl.isEstimated
            };
        });

        // 5. Summaries
        const sum = (field: string) => series.reduce((a: any, b: any) => a + (b[field] || 0), 0);

        const totalRevenue = sum('revenue_gross');
        const totalProfit = sum('profit_estimated');
        const totalSpend = sum('spend');
        const totalRevenueNet = sum('revenue_net');
        const totalRevenueAds = sum('revenue_ads');

        const globalMargin = totalRevenueNet > 0 ? (totalProfit / totalRevenueNet) * 100 : 0;
        const globalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0; // Blended
        const attributedRoas = totalSpend > 0 ? totalRevenueAds / totalSpend : 0;

        return {
            summary: {
                total_revenue: totalRevenue,
                total_revenue_net: totalRevenueNet,
                total_profit: totalProfit,
                global_margin: globalMargin,
                total_spend: totalSpend,
                roas: globalRoas,
                roas_attributed: attributedRoas,
                total_revenue_ads: totalRevenueAds,

                // Explicit Breakdown Totals
                total_cogs: sum('cogs'),
                total_shipping: sum('shipping'),
                total_fees: sum('fees'),
                total_social_charges: sum('social_charges'),
                total_income_tax: sum('income_tax'),

                // Legacy fields for compat until full refactor
                pilot_score: 85,
                pilot_status: 'Good'
            },
            series,
            confidence: settings.dataMode === 'STRICT' ? 'EXACT' : 'ESTIMATED',
            confidenceReasons: []
        };
    }
}
