import { UserSettings, FinanceDailyMetric, AdsChannelMetric } from "@/types/data";

// Default Profile for a typical E-commerce
export const DEFAULT_SETTINGS: UserSettings = {
    currency: 'EUR',
    costProfile: {
        platformFeesPercent: 2.9, // Stripe + Shopify
        shippingCostAvg: 4.50,
        returnRatePercent: 8,
        cogsEstimatedPercent: 40 // ~60% Gross Margin
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
        const { platformFeesPercent, shippingCostAvg, cogsEstimatedPercent } = settings.costProfile;

        const fees = revenueGross * (platformFeesPercent / 100);
        const shipping = orders * shippingCostAvg;
        const cogs = revenueGross * (cogsEstimatedPercent / 100);

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
            const grossMarginParam = 1 - (settings.costProfile.cogsEstimatedPercent / 100);
            const breakevenRoas = 1 / grossMarginParam;

            // Add buffer for OpEx (shipping/fees) roughly 15%
            const targetRoas = breakevenRoas * 1.15;

            let status: 'profitable' | 'subsidized' | 'neutral' = 'neutral';
            if (ad.roas > targetRoas) status = 'profitable';
            else if (ad.roas < breakevenRoas) status = 'subsidized'; // Burning cash

            // Estimated Contribution (Revenue attributed via ROAS - Spend)
            // Revenue = Spend * ROAS
            const estimatedRevenue = ad.spend * ad.roas;
            const estimatedCogs = estimatedRevenue * (settings.costProfile.cogsEstimatedPercent / 100);
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

    /**
     * V6.0 - PILOT Score Engine
     * Calculates the global health score (0-100) based on weighted finance and acquisition metrics.
     */
    static calculateHealthScore(
        metrics: { marginPercent: number, roas: number, profit: number, spend: number },
        targets: UserSettings['targets']
    ): { score: number, status: 'Excellent' | 'Good' | 'Fair' | 'Critical', components: any } {

        // 1. Margin Score (Weight 40%)
        // If Margin >= Target, Score = 100. Else linear decay.
        // If Margin < 0, Score = 0.
        let marginScore = 0;
        if (metrics.marginPercent >= targets.minMargin) marginScore = 100;
        else if (metrics.marginPercent > 0) marginScore = (metrics.marginPercent / targets.minMargin) * 100;
        else marginScore = 0; // Negative margin penalty

        // 2. ROAS Score (Weight 40%)
        // If Spend == 0, we assume "Organic Mode" -> if Profitable, ROAS Score = 100 (Maximum Efficiency).
        let roasScore = 0;
        if (metrics.spend === 0) {
            roasScore = 100;
        } else {
            if (metrics.roas >= targets.minRoas) roasScore = 100;
            else roasScore = (metrics.roas / targets.minRoas) * 100;
        }

        // 3. Profitability Bonus (Weight 20%)
        // Simple binary: Making money = 100, Losing money = 0.
        const profitScore = metrics.profit > 0 ? 100 : 0;

        // Weighted Average
        // If Spend > 0: 40% Margin, 40% ROAS, 20% Profit
        // If Spend == 0: 60% Margin, 40% Profit (No ROAS component effectively 100 makes sense but weighting changes)
        // Let's keep consistent weights for simplicity V1.
        const totalScore = Math.round((marginScore * 0.4) + (roasScore * 0.4) + (profitScore * 0.2));

        let status: 'Excellent' | 'Good' | 'Fair' | 'Critical' = 'Fair';
        if (totalScore >= 90) status = 'Excellent';
        else if (totalScore >= 70) status = 'Good';
        else if (totalScore >= 50) status = 'Fair';
        else status = 'Critical';

        return {
            score: totalScore,
            status,
            components: {
                margin: Math.round(marginScore),
                roas: Math.round(roasScore),
                profit: Math.round(profitScore)
            }
        };
    }
}
