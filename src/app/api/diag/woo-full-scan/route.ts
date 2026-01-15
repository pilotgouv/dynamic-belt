import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { ConnectionService } from '@/lib/connections/connection-service';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const orgId = (session.user as any).organizationId;
        const connection = await prisma.connection.findFirst({
            where: { organizationId: orgId, provider: 'WOOCOMMERCE' }
        });

        if (!connection) {
            return NextResponse.json({ error: 'No WooCommerce connection found' });
        }

        const credentials = ConnectionService.getDecryptedCredentials(connection);
        const consumerKey = credentials.consumerKey || credentials.apiKey;
        const consumerSecret = credentials.consumerSecret || credentials.apiSecret;
        const storeUrl = credentials.shopUrl || credentials.storeUrl;

        const buildUrl = (path: string, params: Record<string, string>) => {
            const url = new URL(`${storeUrl}${path}`);
            url.searchParams.set("consumer_key", consumerKey);
            url.searchParams.set("consumer_secret", consumerSecret);
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
            return url.toString();
        }

        let page = 1;
        let allOrdersCount = 0;
        let statusDistribution: Record<string, number> = {};
        const logs: string[] = [];
        let firstDate = null;
        let lastDate = null;

        // Loop up to 5 pages max for probe
        while (page <= 5) {
            const url = buildUrl("/wp-json/wc/v3/orders", {
                per_page: "100",
                page: String(page),
                orderby: "date",
                order: "asc" // Oldest first
            });

            logs.push(`Fetcher Page ${page}: ${url.replace(consumerSecret, '***')}`);

            const res = await fetch(url);
            if (!res.ok) {
                logs.push(`Error: ${res.status} ${res.statusText}`);
                break;
            }

            const orders = await res.json();
            if (!Array.isArray(orders) || orders.length === 0) {
                logs.push(`Stop: Empty array or not array. Length: ${Array.isArray(orders) ? orders.length : 'Not Array'}`);
                break;
            }

            allOrdersCount += orders.length;

            if (!firstDate) firstDate = orders[0].date_created;
            lastDate = orders[orders.length - 1].date_created;

            orders.forEach((o: any) => {
                statusDistribution[o.status] = (statusDistribution[o.status] || 0) + 1;
            });

            if (orders.length < 100) break;
            page++;
        }

        return NextResponse.json({
            success: true,
            total_fetched: allOrdersCount,
            status_distribution: statusDistribution,
            date_range: { min: firstDate, max: lastDate },
            logs
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
