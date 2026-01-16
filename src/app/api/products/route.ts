
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const end = endParam ? new Date(endParam) : new Date();
    const start = startParam ? new Date(startParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const orgId = user.organizationId;

    try {
        // 1. Aggregate Product Performance (Sales)
        const perf = await prisma.productDaily.groupBy({
            by: ['sku', 'name'],
            where: {
                organizationId: orgId,
                date: { gte: start, lte: end }
            },
            _sum: {
                revenue: true,
                unitsSold: true,
                profitEstimated: true,
                refunds: true
            },
            orderBy: {
                _sum: { revenue: 'desc' }
            }
        });

        // 2. Fetch Metadata (Stock, Image, Status) matching these SKUs
        // optimization: Fetch ALL products for org (if catalog < 10k, usually fine) or filter by SKUs found
        const skus = perf.map(p => p.sku).filter(s => s !== null && s !== "");

        const metadata = await prisma.product.findMany({
            where: {
                orgId: orgId,
                sku: { in: skus as string[] }
            },
            select: {
                sku: true,
                imageUrl: true,
                stockLevel: true,
                providerPrimary: true,
                status: true,
                asin: true
            }
        });

        const metaMap = new Map();
        metadata.forEach(m => metaMap.set(m.sku, m));

        // 3. Merge & Classify
        const totalRev = perf.reduce((a, b) => a + (b._sum.revenue || 0), 0);

        const products = perf.map(p => {
            const meta = metaMap.get(p.sku);
            const revenue = p._sum.revenue || 0;
            const units = p._sum.unitsSold || 0;
            const profit = p._sum.profitEstimated || 0;
            const refunds = p._sum.refunds || 0;

            // Classification Logic
            let statusTag = 'NORMAL';
            if (revenue > (totalRev * 0.05)) statusTag = 'HERO'; // > 5% of total rev
            if (units > 50 && revenue < 500) statusTag = 'VOLUME';
            if (revenue > 1000 && (profit / revenue) < 0.1) statusTag = 'RISK'; // High Rev, Low Margin

            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

            return {
                sku: p.sku || 'UNKNOWN',
                name: p.name,
                imageUrl: meta?.imageUrl || null,
                provider: meta?.providerPrimary || 'MANUAL',
                stock: meta?.stockLevel || 0,
                units,
                revenue,
                profit,
                margin,
                statusTag, // HERO, RISK, SUPPORT
                refunds
            };
        });

        // 4. Summaries
        const totalSkus = products.length;
        const totalProfit = products.reduce((a, b) => a + b.profit, 0);
        const avgMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
        const heroCount = products.filter(p => p.statusTag === 'HERO').length;

        // Calculate Top SKU Profit Share
        const topProfitSku = products.reduce((max, p) => p.profit > max ? p.profit : max, 0);
        const topSkuProfitShare = totalProfit > 0 ? (topProfitSku / totalProfit) * 100 : 0;

        return NextResponse.json({
            summary: {
                totalSkus,
                totalRevenue: totalRev,
                totalProfit,
                avgMargin,
                heroCount,
                topSkuProfitShare
            },
            products
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
