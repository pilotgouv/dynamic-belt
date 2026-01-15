import { UserSettings, FinanceDailyMetric, AdsChannelMetric } from "@/types/data";

// Default Profile for a typical E-commerce
export const DEFAULT_SETTINGS: UserSettings = {
    currency: 'EUR',
    costProfile: {
        platformFeesPercent: 2.9, // Stripe + Shopify
        shippingCostAvg: 4.50,
        returnRatePercent: 8,
        cogsEsitmatedPercent: 40 // ~60% Gross Margin
    },
    targets: {
        minRoas: 2.5,
        minMargin: 20
    }
};

/**
 * Core Business Logic Engine
 * Recalculates metrics based on User Settings (Cost Profile)
 */
export class BusinessEngine {

    static calculateProfit(revenueGross: number, refundsValue: number, adSpend: number, orders: number, settings: UserSettings): Partial<FinanceDailyMetric> {
        const { platformFeesPercent, shippingCostAvg, cogsEsitmatedPercent } = settings.costProfile;

        const fees = revenueGross * (platformFeesPercent / 100);
        const shipping = orders * shippingCostAvg;
        const cogs = revenueGross * (cogsEsitmatedPercent / 100);

        // Net Revenue: Use real refunds if available, otherwise estimate
        const refundAmount = refundsValue > 0 ? refundsValue : (revenueGross * (settings.costProfile.returnRatePercent / 100));
        const revenueNet = revenueGross - refundAmount;

        // True Economic Profit Formula
        const totalCosts = adSpend + fees + shipping + cogs;
        const profit = revenueNet - totalCosts;
        const margin = revenueNet > 0 ? (profit / revenueNet) * 100 : 0;

        return {
            revenueNet,
            transactionFees: fees,
            shippingCost: shipping,
            costOfGoods: cogs,
            adSpendTotal: adSpend, // Pass through for reference
            profitEstimated: profit,
            profitMarginPercent: margin
        };
    }

    /**
     * V2.4 - Channel Arbitrage
     * Evaluates channel efficiency by estimating contribution to profit.
     * Requires aggregated Ads Metrics and total Revenue to attribute.
     */
    static analyzeChannelArbitrage(
        adsData: AdsChannelMetric[],
        totalRevenue: number,
        settings: UserSettings
    ): { channel: string, contribution: number, status: 'profitable' | 'subsidized' | 'neutral' }[] {

        // This is a heuristic model since we don't have per-channel revenue attribution in this context yet.
        // We use ROAS as a proxy for contribution efficiency relative to the Global Margin Target.

        return adsData.map(ad => {
            // Breakeven ROAS = 1 / (Gross Margin %)
            // e.g. if Margin is 60% (0.6), BE ROAS = 1.66
            const grossMarginParam = 1 - (settings.costProfile.cogsEsitmatedPercent / 100);
            const breakevenRoas = 1 / grossMarginParam;

            // Add buffer for OpEx (shipping/fees) roughly 15%
            const targetRoas = breakevenRoas * 1.15;

            let status: 'profitable' | 'subsidized' | 'neutral' = 'neutral';
            if (ad.roas > targetRoas) status = 'profitable';
            else if (ad.roas < breakevenRoas) status = 'subsidized'; // Burning cash

            // Estimated Contribution (Revenue attributed via ROAS - Spend)
            // Revenue = Spend * ROAS
            const estimatedRevenue = ad.spend * ad.roas;
            const estimatedCogs = estimatedRevenue * (settings.costProfile.cogsEsitmatedPercent / 100);
            const estimatedProfit = estimatedRevenue - ad.spend - estimatedCogs;

            return {
                channel: ad.channel,
                contribution: estimatedProfit,
                status
            };
        });
    }

    static generateAlerts(
        finance: Partial<FinanceDailyMetric> | undefined,
        ads: AdsChannelMetric[],
        targets: UserSettings['targets']
    ): { type: 'critical' | 'warning' | 'info', category: string, message: string }[] {
        const alerts: { type: 'critical' | 'warning' | 'info', category: string, message: string }[] = [];

        if (!finance) return alerts;

        // 1. Finance Alerts
        if (finance.profitEstimated !== undefined && finance.profitEstimated < 0) {
            alerts.push({
                type: 'critical',
                category: 'finance',
                message: `Business déficitaire. Profit Net Estimé: ${this.formatCurrency(finance.profitEstimated)}`
            });
        }

        if (finance.profitMarginPercent !== undefined && finance.profitMarginPercent < targets.minMargin) {
            alerts.push({
                type: 'warning',
                category: 'finance',
                message: `Marge trop faible (${finance.profitMarginPercent.toFixed(1)}%). Cible: ${targets.minMargin}%`
            });
        }

        // 2. Ads Alerts (Mock logic for now, would aggregate real channel data)
        const highSpendChannel = ads.find(c => c.spend > 500 && c.roas < 2);
        if (highSpendChannel) {
            alerts.push({
                type: 'critical',
                category: 'ads',
                message: `Fuite de budget sur ${highSpendChannel.channel} (ROAS ${highSpendChannel.roas.toFixed(2)})`
            });
        }

        return alerts;
    }

    static getHealthStatus(metric: FinanceDailyMetric, targets: UserSettings['targets']): 'healthy' | 'warning' | 'critical' {
        if (metric.profitMarginPercent < 0) return 'critical';
        if (metric.profitMarginPercent < targets.minMargin) return 'warning';
        return 'healthy';
    }

    static formatCurrency(amount: number, currency: string = 'EUR'): string {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
    }
}
