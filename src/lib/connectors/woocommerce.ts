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
            // WooCommerce uses 'after' and 'before' ISO strings
            const params = new URLSearchParams({
                after: fromDate.toISOString(),
                before: toDate.toISOString(),
                per_page: '100', // Pagination needed for prod, keeping simple for V2
                status: 'completed,processing,on-hold'
            });

            const url = `${this.storeUrl}/wp-json/wc/v3/orders?${params.toString()}`;

            const res = await fetch(url, {
                headers: {
                    "Authorization": this.getAuthHeader()
                }
            });

            if (!res.ok) {
                throw new Error(`WooCommerce API Error: ${res.statusText} (${res.status})`);
            }

            const orders = await res.json();

            // Normalize
            const dailyMap = new Map<string, { revenue: number, net: number, orders: number, refunds: number }>();

            orders.forEach((order: any) => {
                const day = order.date_created.split('T')[0];
                const current = dailyMap.get(day) || { revenue: 0, net: 0, orders: 0, refunds: 0 };

                const total = parseFloat(order.total);
                const refundTotal = parseFloat(order.refund_total || '0');

                dailyMap.set(day, {
                    revenue: current.revenue + total,
                    net: current.net + (total - refundTotal),
                    orders: current.orders + 1,
                    refunds: current.refunds + refundTotal
                });
            });

            dailyMap.forEach((val, date) => {
                result.financeMetrics.push({
                    date: date,
                    revenueGross: val.revenue,
                    revenueNet: val.net,
                    ordersCount: val.orders,
                    refundsValue: val.refunds
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
