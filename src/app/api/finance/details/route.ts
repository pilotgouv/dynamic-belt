
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { organizationId, type, rangeStart, rangeEnd } = body;

    if (!organizationId || !type || !rangeStart || !rangeEnd) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);

    // Fetch Settings for Context
    const settings = await prisma.settings.findUnique({ where: { organizationId } });
    const isStrict = settings?.dataMode === 'STRICT';

    try {
        let items: any[] = [];
        let headers: any[] = [];
        let title = '';

        if (type === 'shipping_fees') {
            title = 'Détail Frais de Livraison & Transaction';

            // Fetch Orders
            const orders = await prisma.order.findMany({
                where: {
                    orgId: organizationId,
                    createdAtSource: { gte: start, lte: end }
                },
                orderBy: { createdAtSource: 'desc' },
                take: 1000 // Limit for safety
            });

            headers = [
                { key: 'date', label: 'Date' },
                { key: 'orderNumber', label: 'Commande' },
                { key: 'shippingReal', label: 'Livraison (Reel)' },
                { key: 'shippingRule', label: 'Livraison (Règle)' },
                { key: 'fees', label: 'Frais Trans.' }
            ];

            items = orders.map(o => {
                // Calc Rule
                let ruleVal = 0;
                if (settings?.shippingCostMode === 'FIXED_PER_ORDER') ruleVal = settings.shippingCostValue;
                else if (settings?.shippingCostMode === 'PERCENT_REVENUE') ruleVal = o.grossRevenue * (settings.shippingCostValue / 100);

                // Fee Rule
                let feeVal = (o.grossRevenue * ((settings?.paymentFeePercent || 0) / 100)) + (settings?.paymentFeeFixed || 0);

                return {
                    id: o.id,
                    date: o.createdAtSource,
                    orderNumber: o.orderNumber || o.externalId,
                    shippingReal: o.shippingRevenue, // Proxy
                    shippingRule: ruleVal,
                    fees: feeVal // We don't have real fees in Order field easily yet, using Rule as 'Applied Fee'
                };
            });
        }

        else if (type === 'ads') {
            title = 'Détail Dépenses Publicitaires';
            // Fetch AdsDaily
            const ads = await prisma.adsDaily.findMany({
                where: {
                    organizationId,
                    date: { gte: start, lte: end }
                },
                orderBy: { spend: 'desc' }
            });

            // Group by Campaign
            const campMap = new Map<string, number>();
            ads.forEach(a => {
                const key = `${a.channel} - ${a.campaign}`;
                campMap.set(key, (campMap.get(key) || 0) + a.spend);
            });

            headers = [
                { key: 'campaign', label: 'Campagne' },
                { key: 'spend', label: 'Dépenses' }
            ];

            items = Array.from(campMap.entries()).map(([k, v]) => ({
                id: k,
                campaign: k,
                spend: v
            })).sort((a, b) => b.spend - a.spend);
        }

        else if (type === 'cogs') {
            title = `Détail COGS (${isStrict ? 'Strict' : 'Estimé'})`;

            // Fetch ProductDaily
            const productDaily = await prisma.productDaily.findMany({
                where: { organizationId, date: { gte: start, lte: end } },
            });

            // Group by SKU
            const skuMap = new Map<string, { units: number, revenue: number }>();
            productDaily.forEach(p => {
                const k = p.sku;
                if (!skuMap.has(k)) skuMap.set(k, { units: 0, revenue: 0 });
                const e = skuMap.get(k)!;
                e.units += p.unitsSold;
                e.revenue += p.revenue;
            });

            // Fetch Product Costs
            const skus = Array.from(skuMap.keys());
            const products = await prisma.product.findMany({
                where: { orgId: organizationId, sku: { in: skus } },
                select: { sku: true, costUnit: true, title: true }
            });

            const costMap = new Map(products.map(p => [p.sku!, p]));

            headers = [
                { key: 'sku', label: 'SKU' },
                { key: 'name', label: 'Nom' },
                { key: 'units', label: 'Unités' },
                { key: 'costUnit', label: 'Coût Unitaire' },
                { key: 'totalCost', label: 'Coût Total' },
                { key: 'status', label: 'Statut' }
            ];

            items = Array.from(skuMap.entries()).map(([sku, data]) => {
                const p = costMap.get(sku);
                const costUnit = p?.costUnit || 0;
                let totalCost = 0;
                let status = 'INCONNU';

                if (costUnit > 0) {
                    totalCost = data.units * costUnit;
                    status = 'EXACT';
                } else {
                    if (!isStrict) {
                        // Estimate
                        // Fallback % of Revenue -> Cost
                        // settings.estimateCogsFallback is COST % (e.g. 40)
                        const fallback = (settings?.estimateCogsFallback || 40) / 100;
                        totalCost = data.revenue * fallback;
                        status = 'ESTIMÉ';
                    } else {
                        status = 'MANQUANT';
                    }
                }

                return {
                    id: sku,
                    sku,
                    name: p?.title || 'Inconnu',
                    units: data.units,
                    costUnit,
                    totalCost,
                    status
                };
            }).sort((a, b) => b.totalCost - a.totalCost);
        }

        return NextResponse.json({ items, headers, title });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
