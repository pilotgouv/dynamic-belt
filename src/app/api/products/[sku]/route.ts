import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recalculateProductHistory } from "@/services/productService";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, props: { params: Promise<{ sku: string }> }) {
    const params = await props.params;
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sku = params.sku;
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const end = endParam ? new Date(endParam) : new Date();
    const start = startParam ? new Date(startParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orgId = user.organizationId;

    try {
        // 1. Fetch Product Metadata & Settings
        const productMeta = await prisma.product.findUnique({
            where: { orgId_sku: { orgId, sku } }
        });

        const settingsRec = await prisma.settings.findUnique({ where: { organizationId: orgId } });
        const settings = {
            cogsPercent: settingsRec?.estimateCogsFallback || 40,
            feesPercent: settingsRec?.paymentFeePercent || 0,
            shippingAvg: settingsRec?.shippingCostValue || 0
        };

        // 2. Fetch Daily Aggregates for Time Series
        const history = await prisma.productDaily.findMany({
            where: {
                organizationId: orgId,
                sku: sku,
                date: { gte: start, lte: end }
            },
            orderBy: { date: 'asc' }
        });

        // 3. Aggregate Totals
        const totalRevenue = history.reduce((a, b) => a + b.revenue, 0);
        const totalUnits = history.reduce((a, b) => a + b.unitsSold, 0);
        const totalRefunds = history.reduce((a, b) => a + b.refunds, 0);

        // 4. Decomposition Estimates (Precise via Items or Fallback)
        const orderItems = await prisma.orderItem.findMany({
            where: {
                orgId: orgId,
                sku: sku,
                order: {
                    createdAtSource: { gte: start, lte: end }
                }
            },
            include: {
                order: {
                    select: { provider: true, currency: true }
                }
            }
        });

        // Dynamic Calculation Loop
        let calcRevenue = 0;
        let calcCogs = 0;
        let calcFees = 0;
        let calcProfit = 0;
        const channels: Record<string, any> = {};

        // Helper to get number from Decimal or number
        const getCost = (p: any): number | null => {
            if (!p?.costUnit) return null;
            if (typeof p.costUnit === 'object' && 'toNumber' in p.costUnit) return p.costUnit.toNumber();
            return Number(p.costUnit);
        };
        const realCostUnit = getCost(productMeta);

        if (orderItems.length > 0) {
            orderItems.forEach(item => {
                const ch = item.order.provider;
                if (!channels[ch]) channels[ch] = { revenue: 0, units: 0, profit: 0 };

                const rev = item.lineRevenue;

                // COGS: Use Item's Allocated OR Product's Fixed Cost OR Global % estimate
                let cogs = item.cogsAllocated;
                if (cogs === 0) {
                    if (realCostUnit !== null) cogs = realCostUnit * item.quantity;
                    else cogs = rev * (settings.cogsPercent / 100);
                }

                // Fees: Use Item's Allocated OR Global %
                let fees = item.feesAllocated;
                if (fees === 0) {
                    fees = rev * (settings.feesPercent / 100);
                }

                // Profit
                const profit = rev - cogs - fees;

                // Aggregates
                calcRevenue += rev;
                calcCogs += cogs;
                calcFees += fees;
                calcProfit += profit;

                // Channel Aggregates
                channels[ch].revenue += rev;
                channels[ch].units += item.quantity;
                channels[ch].profit += profit;
            });
        } else {
            // Fallback to ProductDaily aggregates if no granular items
            calcRevenue = totalRevenue;

            if (realCostUnit !== null) calcCogs = realCostUnit * totalUnits;
            else calcCogs = totalRevenue * (settings.cogsPercent / 100);

            calcFees = totalRevenue * (settings.feesPercent / 100);
            calcProfit = totalRevenue - calcCogs - calcFees;
        }

        const channelBreakdown = Object.entries(channels).map(([key, val]) => ({
            channel: key,
            ...val
        })).sort((a, b) => b.revenue - a.revenue);

        // Waterfall Prep (Rev - Refunds - COGS - Fees = Net Profit)
        const waterfall = {
            revenue: calcRevenue,
            refunds: totalRefunds,
            cogs: calcCogs,
            fees: calcFees,
            marketing: 0,
            profit: calcProfit - totalRefunds
        };

        // Time Series Formatting
        const timeSeries = history.map(d => ({
            date: d.date.toISOString(),
            revenue: d.revenue,
            profit: d.profitEstimated,
            units: d.unitsSold
        }));

        // AI Coach / Insights
        const insights = [];
        const marginPct = calcRevenue > 0 ? ((calcProfit - totalRefunds) / calcRevenue) : 0;

        if (calcProfit <= 0) insights.push({ type: 'danger', text: "Produit non rentable sur la période. Vérifiez les coûts (COGS)." });
        else if (marginPct < 0.15) insights.push({ type: 'warning', text: "Marge faible (< 15%). Vérifiez les frais et le COGS." });
        else insights.push({ type: 'success', text: "Bonne performance de marge." });

        if (channelBreakdown.length === 1) insights.push({ type: 'info', text: `Dépendance totale à ${channelBreakdown[0].channel}.` });

        return NextResponse.json({
            meta: {
                ...productMeta,
                costUnit: realCostUnit // Ensure simple number is sent to frontend
            },
            summary: {
                revenue: totalRevenue,
                units: totalUnits,
                profit: waterfall.profit,
                margin: marginPct * 100
            },
            waterfall,
            channels: channelBreakdown,
            series: timeSeries,
            insights
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ sku: string }> }) {
    const params = await props.params;
    const session = await auth();
    const user = session?.user as any;
    if (!user || (!user.organizationId && !user.orgId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = user.organizationId || user.orgId;
    const sku = params.sku;

    try {
        const body = await req.json();
        const { costUnit } = body;

        // Validation
        if (typeof costUnit !== 'number') {
            return NextResponse.json({ error: "Invalid cost (must be number)" }, { status: 400 });
        }

        // 1. Update Product Master Data
        const updatedProduct = await prisma.product.update({
            where: { orgId_sku: { orgId, sku } },
            data: { costUnit: costUnit }
        });

        // 2. Trigger async recalculation for historical data (ProductDaily)
        // We await it here for the user feedback loop to be instant (they want "Vrai Profit" to update everywhere)
        await recalculateProductHistory(orgId, sku, costUnit);

        // Return simpler response as it is Float now
        return NextResponse.json({ success: true, product: updatedProduct });

    } catch (e: any) {
        console.error("Error updating COGS:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
