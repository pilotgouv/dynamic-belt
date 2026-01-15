import { DataSourceConnector, ConnectorResult } from "./types";

export class WooCommerceConnector implements DataSourceConnector {
    provider = 'woocommerce';
    private storeUrl: string;
    private consumerKey: string;
    private consumerSecret: string;

    constructor(storeUrl: string, consumerKey: string, consumerSecret: string) {
        // Ensure storeUrl has protocol but no trailing slash
        let url = storeUrl.replace(/\/$/, "");
        if (!url.startsWith("http")) {
            url = `https://${url}`;
        }
        this.storeUrl = url;
        this.consumerKey = consumerKey;
        this.consumerSecret = consumerSecret;
    }

    async connect(credentials: any): Promise<boolean> {
        return await this.validateToken();
    }

    private buildUrl(path: string, params: Record<string, string | number | boolean | undefined>) {
        const url = new URL(`${this.storeUrl}${path}`);
        // Woo safe auth (most compatible) - Pass credentials in Query Params
        url.searchParams.set("consumer_key", this.consumerKey);
        url.searchParams.set("consumer_secret", this.consumerSecret);

        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        });
        return url.toString();
    }

    async validateToken(): Promise<boolean> {
        try {
            // Remove Authorization header usage
            const url = this.buildUrl("/wp-json/wc/v3/system_status", {});
            const res = await fetch(url);
            return res.status === 200;
        } catch (e) {
            return false;
        }
    }

    async sync(fromDate: Date, toDate: Date, options: { deepSync?: boolean } = {}): Promise<ConnectorResult> {
        const result: ConnectorResult = {
            success: false,
            importedCount: 0,
            errors: [],
            financeMetrics: [],
            productMetrics: []
        };

        const allOrders: any[] = [];
        let page = 1;
        let hasMore = true;

        // Force Deep Sync if requested or if date is very old
        const isDeepSync = options.deepSync || fromDate.getFullYear() <= 2020;

        console.log(`[WooCommerce] Starting Sync. DeepSync: ${isDeepSync}. From ${fromDate.toISOString()}`);

        try {
            // Deep Sync: safety cap 500 pages (50,000 orders). Incremental: 20 pages (2,000 orders).
            const MAX_PAGES = isDeepSync ? 500 : 20;

            while (hasMore && page <= MAX_PAGES) {
                const queryParams: Record<string, string | number | boolean | undefined> = {
                    per_page: '100',
                    page: page.toString(),
                    order: isDeepSync ? 'asc' : 'desc',
                    orderby: 'date' // Using date as requested for deep sync
                    // NO STATUS param at all (Fetch everything: cancelled, failed, etc.)
                };

                // Date Filters:
                // Incremental only. Deep sync gets everything.
                if (!isDeepSync) {
                    // Format: YYYY-MM-DDTHH:mm:ss
                    queryParams.after = fromDate.toISOString().split('.')[0];
                }

                // Incremental 'before' cap
                if (!isDeepSync) {
                    queryParams.before = toDate.toISOString().split('.')[0];
                }

                // USE NEW BUILD_URL (No Headers needed)
                const url = this.buildUrl("/wp-json/wc/v3/orders", queryParams);

                console.log(`[WooCommerce] Fetching Page ${page}. Mode: ${isDeepSync ? 'DEEP' : 'INC'}. Url: ${url.replace(this.consumerSecret, '***')}`);

                // Retry logic
                let res;
                let retries = 0;
                while (retries < 3) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 30000);

                        // NO HEADERS! Auth is in URL.
                        res = await fetch(url, { signal: controller.signal });

                        clearTimeout(timeoutId);
                        if (res.ok) break;
                        throw new Error(`Status ${res.status} - ${res.statusText}`);
                    } catch (e: any) {
                        retries++;
                        console.warn(`[WooCommerce] Retry ${retries} for page ${page}. Error: ${e.message}`);
                        await new Promise(r => setTimeout(r, 2000 * retries));
                    }
                }

                if (!res || !res.ok) {
                    throw new Error(`WooCommerce API Failed: ${res?.status} ${res?.statusText}`);
                }

                const pageOrders = await res.json();

                if (Array.isArray(pageOrders)) {
                    // Log diagnosis for this page
                    if (pageOrders.length > 0) {
                        const firstDate = pageOrders[0].date_created;
                        const lastDate = pageOrders[pageOrders.length - 1].date_created;
                        console.log(`[WooCommerce] Page ${page} received ${pageOrders.length} orders. Range: ${firstDate} -> ${lastDate}`);
                    } else {
                        console.log(`[WooCommerce] Page ${page} received 0 orders.`);
                    }

                    // Log Status Distribution
                    const statusCounts = pageOrders.reduce((acc: any, o: any) => {
                        acc[o.status] = (acc[o.status] || 0) + 1;
                        return acc;
                    }, {});
                    console.log(`[WooCommerce] Page ${page} Statuses:`, JSON.stringify(statusCounts));

                    // Local Filtering: Relaxed to include custom statuses like 'delivered'
                    // We found 'delivered' (35 orders) which is non-standard but valid for this store.
                    const validStatuses = ['completed', 'processing', 'on-hold', 'refunded', 'pending', 'failed', 'cancelled', 'delivered', 'shipped', 'done'];
                    const filteredOrders = pageOrders.filter((o: any) => validStatuses.includes(o.status));

                    if (filteredOrders.length < pageOrders.length) {
                        const dropped = pageOrders.filter((o: any) => !validStatuses.includes(o.status));
                        console.warn(`[WooCommerce Warning] Dropped ${dropped.length} orders with unknown statuses:`, dropped.map((o: any) => o.status));
                    }

                    console.log(`[WooCommerce] Page ${page}: Importing ${filteredOrders.length} / ${pageOrders.length} orders.`);

                    allOrders.push(...filteredOrders);

                    if (pageOrders.length < 100) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    console.error("[WooCommerce] Unexpected response format (not array):", pageOrders);
                    hasMore = false;
                }

                if (page >= MAX_PAGES) {
                    console.warn(`[WooCommerce] Safety Cap Reached (${MAX_PAGES} pages). Sync stopped.`);
                    hasMore = false;
                }
            }

            const orders = allOrders;

            // Normalize
            const dailyMap = new Map<string, { revenue: number, net: number, orders: number, refunds: number, cogs: number }>();
            const productMap = new Map<string, { name: string, units: number, revenue: number, sku: string, cogs: number }>();

            orders.forEach((order: any) => {
                const day = order.date_created.split('T')[0];
                let orderCogs = 0;

                // Product Stats
                if (order.line_items && Array.isArray(order.line_items)) {
                    order.line_items.forEach((item: any) => {
                        const key = `${day}::${item.sku || item.product_id}`;
                        const sku = item.sku || `ID-${item.product_id}`;
                        const pCurrent = productMap.get(key) || { name: item.name, units: 0, revenue: 0, sku, cogs: 0 };

                        // Handle potential string numbers
                        const qty = parseFloat(item.quantity) || 0;
                        const lineTotal = parseFloat(item.total) || 0;

                        // Try find COGS in meta
                        let unitCost = 0;
                        const metas = item.meta_data || [];
                        // Common Cost Keys from plugins (Cost of Goods, etc.)
                        const costMeta = metas.find((m: any) => ['_cost', '_product_cost', '_alg_wc_cog_cost', '_wc_cog_cost', 'cost_price', 'cost'].includes(m.key));
                        if (costMeta) {
                            unitCost = parseFloat(costMeta.value) || 0;
                        }

                        const lineCogs = unitCost * qty;
                        orderCogs += lineCogs;

                        productMap.set(key, {
                            name: item.name,
                            units: pCurrent.units + qty,
                            revenue: pCurrent.revenue + lineTotal,
                            sku: sku,
                            cogs: pCurrent.cogs + lineCogs
                        });
                    });
                }

                // Finance Stats
                const current = dailyMap.get(day) || { revenue: 0, net: 0, orders: 0, refunds: 0, cogs: 0 };
                const total = parseFloat(order.total);
                const refundTotal = parseFloat(order.refund_total || '0');

                dailyMap.set(day, {
                    revenue: current.revenue + total,
                    net: current.net + (total - refundTotal),
                    orders: current.orders + 1,
                    refunds: current.refunds + refundTotal,
                    cogs: current.cogs + orderCogs
                });
            });

            dailyMap.forEach((val, date) => {
                result.financeMetrics.push({
                    date: date,
                    revenueGross: val.revenue,
                    revenueNet: val.net,
                    ordersCount: val.orders,
                    refundsValue: val.refunds,
                    costOfGoods: val.cogs
                });
            });

            productMap.forEach((val, key) => {
                const [date] = key.split('::');
                result.productMetrics.push({
                    date: date,
                    sku: val.sku,
                    name: val.name,
                    unitsSold: val.units,
                    revenue: val.revenue,
                    marginEstimated: 0,
                    profitEstimated: val.revenue - val.cogs // Real Profit if COGS found!
                });
            });

            result.success = true;
            result.importedCount = orders.length;

        } catch (error: any) {
            console.error("WooCommerce Sync Error", error);
            result.errors.push(error.message);
            result.success = false;
        }

        return result;
    }
}
