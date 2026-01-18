import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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

        // 2. Fetch Metadata (Stock, Image, Status) 
        // Strategy: First try strict SKU match. If missing, we might be dealing with a variant 
        // where we only synced the parent or vice versa.

        const skus = perf.map(p => p.sku).filter(s => s !== null && s !== "");

        // Fetch ALL products for org to do smart matching in memory (safer for variations)
        // Optimization: For huge catalogs, strictly filter by SKU list, but here we need parents too.
        const allMetadata = await prisma.product.findMany({
            where: { orgId: orgId },
            select: {
                id: true,
                sku: true,
                title: true,
                imageUrl: true,
                stockLevel: true,
                providerPrimary: true,
                status: true,
                costUnit: true,
                costDetails: true
            }
        });

        // SORT by Title Length DESC to ensure "T-Shirt Red" matches before "T-Shirt"
        allMetadata.sort((a, b) => b.title.length - a.title.length);

        const metaMap = new Map();
        // Index by SKU
        allMetadata.forEach(m => {
            if (m.sku) metaMap.set(m.sku, m);
        });

        // 3. Merge & Classify
        const totalRev = perf.reduce((a, b) => a + (b._sum.revenue || 0), 0);

        const products = perf.map(p => {
            let meta = metaMap.get(p.sku);

            // Fallback Logic:
            // If strict SKU match failed, try to find a product that "looks like" this one
            // This is a naive heuristic but helps with syncing gaps (Parent vs Variation)
            if (!meta && p.name) {
                // Try finding by Name similarity (very basic)
                // e.g. "Crystal Rouge - 50ml" might match "Crystal Rouge" parent
                const potentialParent = allMetadata.find(m =>
                    p.name.includes(m.title) || m.title.includes(p.name)
                );
                if (potentialParent) meta = potentialParent;
            }

            let imageUrl = meta?.imageUrl;
            if (!imageUrl && meta && allMetadata) {
                // Heuristic: If title contains " - ", try finding parent by prefix
                if (meta.title && meta.title.includes(' - ')) {
                    const parentTitle = meta.title.split(' - ')[0];
                    const parent = allMetadata.find(m => m.title === parentTitle && m.imageUrl);
                    if (parent) imageUrl = parent.imageUrl;
                }
                // Fallback: StartsWith
                if (!imageUrl && meta.title) {
                    const parent = allMetadata.find(m => meta.title.startsWith(m.title) && m.imageUrl && m.id !== meta.id && m.title.length < meta.title.length);
                    if (parent) imageUrl = parent.imageUrl;
                }
            }

            // If we still have no ID, we can't edit cost. 
            // We'll mark it as INVALID so UI knows.

            const revenue = p._sum.revenue || 0;
            const units = p._sum.unitsSold || 0;
            const profit = p._sum.profitEstimated || 0;
            const refunds = p._sum.refunds || 0;

            // Classification Logic
            let statusTag = 'NORMAL';
            if (revenue > (totalRev * 0.05)) statusTag = 'HERO';
            if (units > 50 && revenue < 500) statusTag = 'VOLUME';
            if (revenue > 1000 && (profit / revenue) < 0.1) statusTag = 'RISK';

            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

            return {
                id: meta?.id || null, // Critical for editing
                sku: p.sku || 'UNKNOWN',
                name: meta?.title || p.name, // Prefer clean title from DB
                imageUrl: meta?.imageUrl || null,
                provider: meta?.providerPrimary || 'MANUAL',
                stock: meta?.stockLevel || 0,
                costUnit: meta?.costUnit ?? null,
                costDetails: meta?.costDetails ?? [],
                units,
                revenue,
                profit,
                margin,
                statusTag,
                refunds
            };
        });

        // 4. Summaries
        const totalSkus = products.length;
        const totalProfit = products.reduce((a, b) => a + b.profit, 0);
        const avgMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
        const heroCount = products.filter(p => p.statusTag === 'HERO').length;

        const topProfitSku = products.reduce((max, p) => p.profit > max ? p.profit : max, 0);
        const topSkuProfitShare = totalProfit > 0 ? (topProfitSku / totalProfit) * 100 : 0;
        const catalogCount = allMetadata.length;

        return NextResponse.json({
            summary: {
                totalSkus,
                totalRevenue: totalRev,
                totalProfit,
                avgMargin,
                heroCount,
                topSkuProfitShare,
                catalogCount
            },
            products
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
