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
            // Fetch Orders
            let page = 1;
            let hasMore = true;
            const allOrders: any[] = [];
            const MAX_PAGES = 100; // Safety cap 10,000 orders

            while (hasMore && page <= MAX_PAGES) {
                const params = new URLSearchParams({
                    after: fromDate.toISOString(),
                    before: toDate.toISOString(),
                    per_page: '100',
                    page: page.toString(),
                    status: 'completed,processing,on-hold',
                    orderby: 'date',
                    order: 'desc'
                });

                const url = `${this.storeUrl}/wp-json/wc/v3/orders?${params.toString()}`;

                const res = await fetch(url, {
                    headers: {
                        "Authorization": this.getAuthHeader()
                    }
                });

                if (!res.ok) {
                    throw new Error(`WooCommerce API Error: ${res.statusText} (${res.status}) on page ${page}`);
                }

                const orders = await res.json();
                allOrders.push(...orders);

                if (orders.length < 100) {
                    hasMore = false;
                } else {
                    page++;
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
