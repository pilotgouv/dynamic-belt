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

    private getAuthHeader(): string {
        if (typeof window !== "undefined") return ""; // Should run on server
        return "Basic " + Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString("base64");
    }

    async connect(credentials: any): Promise<boolean> {
        return await this.validateToken();
    }

    async validateToken(): Promise<boolean> {
        try {
            const res = await fetch(`${this.storeUrl}/wp-json/wc/v3/system_status`, {
                headers: {
                    "Authorization": this.getAuthHeader()
                }
            });
            return res.status === 200;
        } catch (e) {
            return false;
        }
    }

    async sync(fromDate: Date, toDate: Date): Promise<ConnectorResult> {
        const result: ConnectorResult = {
            success: false,
            importedCount: 0,
            errors: [],
            financeMetrics: [],
            productMetrics: []
        };

        try {
            // Determine Mode based on timeframe
            // If fromDate is older than 365 days, treat as Deep Sync (Historical)
            const isDeepSync = fromDate.getTime() < (new Date().getTime() - 365 * 24 * 60 * 60 * 1000);

            console.log(`[WooCommerce] Starting Sync. Mode: ${isDeepSync ? 'DEEP (Historical)' : 'INCREMENTAL'}. From: ${fromDate.toISOString()}`);

            let page = 1;
            let hasMore = true;
            const allOrders: any[] = [];
            // Deep Sync: safety cap 500 pages (50,000 orders). Incremental: 20 pages (2,000 orders).
            const MAX_PAGES = isDeepSync ? 500 : 20;

            while (hasMore && page <= MAX_PAGES) {
                const queryParams: any = {
                    per_page: '100',
                    page: page.toString(),
                    order: isDeepSync ? 'asc' : 'desc',
                    orderby: 'date' // Using date as requested for deep sync
                    // NO STATUS param at all (Fetch everything: cancelled, failed, etc.)
                };

                // Date Filters: 
                // Deep Sync: NO FILTERS. Fetch all history from page 1.
                // Incremental: Use 'after' (and 'before' if needed) to target recent window.
                if (!isDeepSync) {
                    // Format: YYYY-MM-DDTHH:mm:ss
                    queryParams.after = fromDate.toISOString().split('.')[0];
                }

                // Remove 'before' to avoid potential cutoff issues even in Incremental, unless necessary.
                // queryParams.before = ... (Removed for safety)

                const params = new URLSearchParams(queryParams);
                const url = `${this.storeUrl}/wp-json/wc/v3/orders?${params.toString()}`;

                console.log(`[WooCommerce] Fetching Page ${page}. Mode: ${isDeepSync ? 'DEEP' : 'INC'}. Url: ${url}`);

                // Retry logic
                let res;
                let retries = 0;
                while (retries < 3) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
                        res = await fetch(url, {
                            headers: { "Authorization": this.getAuthHeader() },
                            signal: controller.signal
                        });
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

                    // Local Filtering: We requested ALL statuses, so we must filter now to keep only valid sales
                    const validStatuses = ['completed', 'processing', 'on-hold', 'refunded'];
                    const filteredOrders = pageOrders.filter((o: any) => validStatuses.includes(o.status));

                    console.log(`[WooCommerce] Page ${page}: Kept ${filteredOrders.length} valid orders out of ${pageOrders.length} fetched.`);

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
