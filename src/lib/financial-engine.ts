
import { UserSettings } from "@/types/data";

/**
 * Financial Engine v1.0
 * Centralizes all financial logic: VAT, COGS, Shipping, Fees, Profit.
 * Source of Truth for the entire application.
 */
export class FinancialEngine {

    /**
     * computeNetRevenue (Excl. VAT and Refunds)
     */
    static computeNetRevenue(rawRevenue: number, refunds: number, settings: UserSettings): number {
        let revenueHT = rawRevenue;

        // 1. VAT Extraction
        if (settings.vatEnabled) {
            if (settings.vatMode === 'TTC') {
                // Remove VAT: Price / (1 + Rate)
                revenueHT = rawRevenue / (1 + settings.vatRate);
            }
            // If HT, rawRevenue is already HT.
        }

        // 2. Subtract Refunds (assumed to be in same tax mode as revenue for simplicity, or we treat them raw)
        // Usually refunds reduce the Net Revenue directly.
        // If refunds came from source, they might be TTC too if rev is TTC.
        let refundsHT = refunds;
        if (settings.vatEnabled && settings.vatMode === 'TTC') {
            refundsHT = refunds / (1 + settings.vatRate);
        }

        return Math.max(0, revenueHT - refundsHT);
    }

    /**
     * Compute Variable Costs
     */
    static computeCosts(
        revenueHT: number,
        ordersCount: number,
        productCogs: number, // Sum of known costUnit * quantity
        uncoveredRevenue: number, // Revenue from products with NO cost
        settings: UserSettings,
        realShipping: number = 0,
        realFees: number = 0
    ): { cogs: number, shipping: number, fees: number, isEstimated: boolean } {

        let cogs = productCogs;
        let isEstimated = false;

        // 1. COGS Logic
        if (settings.dataMode === 'ESTIMATE') {
            // For uncovered revenue, apply fallback %
            if (uncoveredRevenue > 0) {
                const estimatedCogs = uncoveredRevenue * (settings.estimateCogsFallback / 100);
                cogs += estimatedCogs;
                isEstimated = true;
            }
        }
        // In STRICT mode, we ignore uncovered revenue.

        // 2. Shipping
        let shipping = 0;
        if (settings.dataMode === 'STRICT' && realShipping > 0) {
            shipping = realShipping;
        } else {
            // Fallback to Settings
            if (settings.shippingCostMode === 'FIXED_PER_ORDER') {
                shipping = ordersCount * settings.shippingCostValue;
            } else if (settings.shippingCostMode === 'PERCENT_REVENUE') {
                shipping = revenueHT * (settings.shippingCostValue / 100);
            }
        }

        // 3. Payment Fees
        let fees = 0;
        // In STRICT mode, if we have real fees (from Stripe/etc), use them? 
        // Currently we don't sync real fees explicitly, but if we did:
        if (settings.dataMode === 'STRICT' && realFees > 0) {
            fees = realFees;
        } else {
            fees = (revenueHT * (settings.paymentFeePercent / 100)) + (ordersCount * settings.paymentFeeFixed);
        }

        return { cogs, shipping, fees, isEstimated };
    }

    /**
     * Full P&L Calculation for a day or period
     */
    static calculatePnL(
        input: {
            revenueGross: number,
            refunds: number,
            ordersCount: number,
            adSpend: number,
            productCogsKnown: number, // From DB (sum of costUnit * qty)
            revenueUncovered: number, // Revenue of items with no cost
            realShipping?: number,
            realFees?: number
        },
        settings: UserSettings
    ) {
        const { revenueGross, refunds, ordersCount, adSpend, productCogsKnown, revenueUncovered, realShipping = 0, realFees = 0 } = input;

        // 1. Net Sales
        const revenueNet = this.computeNetRevenue(revenueGross, refunds, settings);

        // 2. Costs
        const costs = this.computeCosts(revenueNet, ordersCount, productCogsKnown, revenueUncovered, settings, realShipping, realFees);

        // 3. Profit
        // Profit = RevNet - COGS - Shipping - Fees - Ads
        const totalCosts = costs.cogs + costs.shipping + costs.fees + adSpend;
        const profit = revenueNet - totalCosts;

        const margin = revenueNet > 0 ? (profit / revenueNet) * 100 : 0;

        // 4. Status Check
        const isComplete = (settings.dataMode === 'ESTIMATE') || (revenueUncovered === 0);

        return {
            revenueNet,
            cogs: costs.cogs,
            shipping: costs.shipping,
            fees: costs.fees,
            adSpend,
            profit,
            margin,
            isEstimated: costs.isEstimated,
            isIncomplete: !isComplete,
            coverageRate: (revenueGross - revenueUncovered) / revenueGross // % of revenue that had cost data
        };
    }
}
