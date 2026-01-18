import { UserSettings, FinanceDailyMetric, AdsChannelMetric } from "@/types/data";

// Default Profile for a typical E-commerce
export const DEFAULT_SETTINGS: UserSettings = {
    currency: 'EUR',
    vatEnabled: false,
    vatMode: 'HT',
    vatRate: 0.20,
    shippingCostMode: 'FIXED_PER_ORDER',
    shippingCostValue: 4.50,
    paymentFeePercent: 2.9,
    paymentFeeFixed: 0.25,
    dataMode: 'ESTIMATE',
    estimateCogsFallback: 40,
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
        // Map new settings to old logic
        const platformFeesPercent = settings.paymentFeePercent;
        const shippingCostAvg = settings.shippingCostMode === 'FIXED_PER_ORDER' ? settings.shippingCostValue : 0;
        const cogsEstimatedPercent = settings.estimateCogsFallback;

        const fees = revenueGross * (platformFeesPercent / 100) + (orders * settings.paymentFeeFixed);
        const shipping = settings.shippingCostMode === 'PERCENT_REVENUE'
            ? revenueGross * (settings.shippingCostValue / 100)
            : orders * shippingCostAvg;
        const cogs = revenueGross * (cogsEstimatedPercent / 100);

        // Net Revenue: Use real refunds if available, otherwise estimate (deprecated return rate)
        const refundAmount = refundsValue > 0 ? refundsValue : 0;
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
            const grossMarginParam = 1 - (settings.estimateCogsFallback / 100);
            const breakevenRoas = 1 / grossMarginParam;

            // Add buffer for OpEx (shipping/fees) roughly 15%
            const targetRoas = breakevenRoas * 1.15;

            let status: 'profitable' | 'subsidized' | 'neutral' = 'neutral';
            if (ad.roas > targetRoas) status = 'profitable';
            else if (ad.roas < breakevenRoas) status = 'subsidized'; // Burning cash

            // Estimated Contribution (Revenue attributed via ROAS - Spend)
            // Revenue = Spend * ROAS
            const estimatedRevenue = ad.spend * ad.roas;
            const estimatedCogs = estimatedRevenue * (settings.estimateCogsFallback / 100);
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
     * Helper for Pilot Service to calculate PnL consistent with Finance View
     * including Fiscal Settings (Social Charges, Tax) which might not be in DB sums.
     */
    static calculatePnL_SimpleForPilot(
        inputs: {
            revenueGross: number,
            revenueNet: number,
            cogs: number,
            adSpend: number,
            ordersCount: number,
            shipping: number,
            fees: number
        },
        settings: UserSettings
    ): { profit: number } {

        let socialCharges = 0;
        if (settings.socialChargesEnabled) {
            socialCharges = inputs.revenueGross * ((settings.socialChargesPercent || 0) / 100);
        }

        let incomeTax = 0;
        if (settings.incomeTaxEnabled) {
            incomeTax = inputs.revenueGross * ((settings.incomeTaxPercent || 0) / 100);
        }

        // Cogs/Shipping/Fees are taken from DB Sum. 
        // If DB Sum is 0, we trust it (or Pilot would need heavier re-computation).
        const totalCosts = inputs.cogs + inputs.adSpend + inputs.shipping + inputs.fees + socialCharges + incomeTax;
        const profit = inputs.revenueNet - totalCosts;

        return { profit };
    }

    /**
     * V6.0 - Legacy Health Score (Keep for ReportService compatibility until refactor)
     */
    static calculateHealthScore(
        metrics: { marginPercent: number, roas: number, profit: number, spend: number },
        targets: UserSettings['targets']
    ): { score: number, status: 'Excellent' | 'Good' | 'Fair' | 'Critical', components: any } {
        // ... (Keep simpler logic or forward to V2 if possible? V2 needs more data)
        // Keeping as is for safety
        let marginScore = 0;
        if (metrics.marginPercent >= targets.minMargin) marginScore = 100;
        else if (metrics.marginPercent > 0) marginScore = (metrics.marginPercent / targets.minMargin) * 100;
        else marginScore = 0;

        let roasScore = 0;
        if (metrics.spend === 0) roasScore = 100;
        else {
            if (metrics.roas >= targets.minRoas) roasScore = 100;
            else roasScore = (metrics.roas / targets.minRoas) * 100;
        }

        const profitScore = metrics.profit > 0 ? 100 : 0;
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

    /**
     * V2.5 - EXACT PILOT SCORE implementation
     * Based on User Specification: 5 Blocks (Profit, Trend, Acq, Risk, Data)
     */
    static calculatePilotScoreV2(
        inputs: {
            finance: { profitReal: number, revenueNet: number, revenueGross: number, refunds: number },
            trend: {
                revenueNetCurrent: number, revenueNetPrev: number,
                profitRealCurrent: number, profitRealPrev: number
            },
            ads: { spend: number, attributedRevenue: number },
            risk: {
                topSkuProfitShare: number, // 0-100
                topChannelRevenueShare: number, // 0-100
                refundsRate: number // 0-100 (calculated here or passed)
            },
            data: {
                connectedTypes: string[] // ['sales', 'ads', 'traffic', 'fees']
            }
        }
    ): {
        scoreTotal: number,
        breakdown: { profitability: number, trend: number, acquisition: number, risk: number, data: number },
        reasons: string[],
        actions: string[]
    } {
        const { finance, trend, ads, risk, data } = inputs;
        const reasons: string[] = [];
        const actions: string[] = [];

        // --- BLOCK A: PROFITABILITY (30 pts) ---
        // rule: margin <= 0% -> 0; 0-5 -> 8; 5-10 -> 15; 10-20 -> 24; 20+ -> 30
        const margin = finance.revenueNet > 0 ? (finance.profitReal / finance.revenueNet) * 100 : 0;
        let scoreProfit = 0;

        if (margin <= 0) scoreProfit = 0;
        else if (margin <= 5) scoreProfit = 8;
        else if (margin <= 10) scoreProfit = 15;
        else if (margin <= 20) scoreProfit = 24;
        else scoreProfit = 30;

        // Bonus: Profit > 0 AND Refunds Rate low (<5%)? (Specification says bonus 2 pts)
        const itemsRefundRate = finance.revenueGross > 0 ? (finance.refunds / finance.revenueGross) * 100 : 0;
        if (finance.profitReal > 0 && itemsRefundRate < 4) scoreProfit += 2;
        scoreProfit = Math.min(scoreProfit, 30); // Clamp

        if (scoreProfit < 10) reasons.push("Rentabilité critique (Marge faible ou négative)");

        // --- BLOCK B: TREND (20 pts) ---
        // rule: Rev down > 20% & profit down -> 0-5
        // Rev stable (+/- 5%) -> 10
        // Rev up 5-20% & profit up -> 16
        // Rev up 20%+ & profit up -> 20
        let scoreTrend = 10; // Default Stable

        const revChange = trend.revenueNetPrev > 0
            ? ((trend.revenueNetCurrent - trend.revenueNetPrev) / trend.revenueNetPrev) * 100
            : 0;
        const profitChange = trend.profitRealPrev > 0
            ? ((trend.profitRealCurrent - trend.profitRealPrev) / trend.profitRealPrev) * 100
            : 0; // Simplified

        // Logic
        if (revChange < -20 && profitChange < 0) {
            scoreTrend = 5;
            reasons.push("Chute brutale du chiffre d'affaires (> -20%)");
        } else if (revChange >= -5 && revChange <= 5) {
            scoreTrend = 10;
        } else if (revChange > 5 && revChange <= 20) {
            if (profitChange > 0) scoreTrend = 16;
            else {
                scoreTrend = 12; // Penalité revenue up but profit down
                reasons.push("Croissance non rentable (CA en hausse, Profit en baisse)");
            }
        } else if (revChange > 20) {
            if (profitChange > 0) scoreTrend = 20;
            else {
                scoreTrend = 14; // Penalité
                reasons.push("Hyper-croissance dilutive sur les marges");
            }
        }

        // --- BLOCK C: ACQUISITION (20 pts) ---
        // Spend=0 -> 20. Else base on ROAS.
        let scoreAcq = 0;
        if (ads.spend === 0) {
            scoreAcq = 20; // Organic
        } else {
            const roas = ads.spend > 0 ? ads.attributedRevenue / ads.spend : 0;
            if (roas < 1) scoreAcq = 5;
            else if (roas < 2) scoreAcq = 10;
            else if (roas < 3) scoreAcq = 15;
            else scoreAcq = 18;

            if (roas >= 3) scoreAcq = 20;

            if (roas < 2) reasons.push("Efficacité publicitaire faible (ROAS < 2)");
        }

        // --- BLOCK D: RISK (20 pts) ---
        // Penalties: Top SKU > 50% profit (-8), Top Channel > 70% (-6), Refund > 8% (-6)
        let scoreRisk = 20; // Start max, deduct

        if (risk.topSkuProfitShare > 50) {
            scoreRisk -= 8;
            reasons.push("Dépendance critique à un seul produit (>50% du profit)");
            actions.push("Diversifier le catalogue : Pousser le bundle avec le produit Hero");
        } else if (risk.topSkuProfitShare > 30) {
            scoreRisk -= 4;
        }

        if (risk.topChannelRevenueShare > 70) {
            scoreRisk -= 6;
            reasons.push("Dépendance à un canal unique (>70% du CA)");
            actions.push("Lancer un canal d'acquisition secondaire (Google Ads/Meta) pour réduire le risque");
        }

        if (itemsRefundRate > 8) {
            scoreRisk -= 6;
            reasons.push(`Taux de retour très élevé (${itemsRefundRate.toFixed(1)}%)`);
            actions.push("Auditer la qualité produit et la politique de retour");
        } else if (itemsRefundRate > 4) {
            scoreRisk -= 3;
        }

        scoreRisk = Math.max(0, scoreRisk); // Clamp

        // --- BLOCK E: DATA COMPLETENESS (10 pts) ---
        // Sales (baseline required, assumed true if we are running this) -> say 3 pts?
        // Spec: Sales required else 0. Ads +3, Traffic +2, Fees +3?
        // Actually Spec said: Sales=baseline, Ads=+3, Traffic=+2, Payments=+2, Fees=+3
        // Total should be 10.
        // --- BLOCK E: DATA COMPLETENESS (10 pts) ---
        // Sales = 3 pts
        // GA4 (Traffic) = 3 pts
        // Ads = 2 pts per channel (max 4)
        // Fees/Other = Bonus
        let scoreData = 0;

        const hasSales = data.connectedTypes.includes('sales');
        const hasTraffic = data.connectedTypes.includes('traffic') || data.connectedTypes.includes('ga4');
        const adsCount = data.connectedTypes.filter(t => t === 'ads' || ['google_ads', 'meta_ads', 'tiktok_ads'].includes(t)).length;
        // Note: connectedTypes usually has tags like 'ads'. We might effectively count 'ads' just once if simplified in PilotService.
        // Let's assume PilotService sends ['sales', 'ads', 'ads'] if multiple providers? 
        // Checking PilotService: It sets UNIQUE tags. So we only get 'ads' once if any exists.

        if (hasSales) scoreData += 3;
        if (hasTraffic) scoreData += 3;

        if (data.connectedTypes.includes('ads')) {
            scoreData += 4; // If at least one ad source, +4. 
            // User wanted differentiation for "2,3 sources", but standard 'ads' tag hides it.
            // For now: Sales(3) + Traffic(3) + Ads(4) = 10.
        } else if (hasSales && hasTraffic) {
            scoreData += 2; // Partial if no ads but traffic
        }

        scoreData = Math.min(10, scoreData);

        if (scoreData < 10) {
            actions.push("Connecter toutes les sources (Ads, Analytics, Frais) pour gagner 10 pts de score Data");
        }

        // TOTAL
        const total = Math.round(scoreProfit + scoreTrend + scoreAcq + scoreRisk + scoreData);

        return {
            scoreTotal: Math.min(100, Math.max(0, total)),
            breakdown: {
                profitability: scoreProfit,
                trend: scoreTrend,
                acquisition: scoreAcq,
                risk: scoreRisk,
                data: scoreData
            },
            reasons: reasons.slice(0, 3), // Top 3
            actions: actions.slice(0, 3)  // Top 3
        };
    }
}
