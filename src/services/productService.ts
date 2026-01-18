import { prisma } from "@/lib/prisma";

/**
 * Recalculates the historical profit and margin for a specific product (SKU)
 * based on the current costUnit stored in the Product table.
 * 
 * @param orgId Organization ID
 * @param sku Product SKU
 * @param costUnit The new Cost Unit (COGS) to apply
 */
export async function recalculateProductHistory(orgId: string, sku: string, costUnit: number) {
  // 1. Fetch Global Settings for Fees (Fallback)
  const settings = await prisma.settings.findUnique({ where: { organizationId: orgId } });
  const globalFeeRate = (settings?.paymentFeePercent || 0) / 100;

  // 2. Fetch all daily records for this product
  // Optimization: In a real large-scale app, we might limit this to the last X years or batch it.
  const dailies = await prisma.productDaily.findMany({
    where: { organizationId: orgId, sku: sku }
  });

  if (dailies.length === 0) return;

  // 3. Prepare updates
  // Since Prisma doesn't support complex calculated updates in updateMany, 
  // we have to iterate. For < 2000 records, Promise.all is acceptable.

  const updates = dailies.map(d => {
    // Logic:
    // Profit = Revenue - Refunds - COGS - Fees
    const revenue = d.revenue || 0;
    const refunds = d.refunds || 0;
    const unitsSq = d.unitsSold || 0;

    const fees = revenue * globalFeeRate;
    const cogs = unitsSq * costUnit;

    if (isNaN(revenue) || isNaN(refunds) || isNaN(fees) || isNaN(cogs)) return null;

    const calcProfit = revenue - refunds - cogs - fees;

    const calcMargin = revenue > 0 ? (calcProfit / revenue) * 100 : 0;

    return prisma.productDaily.update({
      where: { id: d.id },
      data: {
        profitEstimated: calcProfit,
        marginEstimated: calcMargin
      }
    });
  }).filter(u => u !== null);

  await Promise.all(updates);
}
