import { DataSourceConnector, ConnectorResult, ConnectorCapability } from "./types";

interface ShopifyOrder {
    id: number;
    created_at: string;
    updated_at: string; // Added for correct sorting
    total_price: string;
    subtotal_price: string;
    total_discounts: string;
    total_tax: string;
    currency: string;
    financial_status: string;
    line_items: any[];
    refunds: any[];
}

export class ShopifyConnector implements DataSourceConnector {
    provider = 'shopify';
    capabilities: ConnectorCapability[] = ['sales', 'refunds'];
    private accessToken: string;
    private shopDomain: string;

    constructor(accessToken: string, shopDomain: string) {
        this.accessToken = accessToken;
        this.shopDomain = shopDomain;
    }

    async connect(credentials: any): Promise<boolean> {
        return await this.validateToken();
    }

    async validateToken(): Promise<boolean> {
        try {
            const res = await fetch(`https://${this.shopDomain}/admin/api/2024-01/shop.json`, {
                headers: { 'X-Shopify-Access-Token': this.accessToken }
            });
            return res.status === 200;
        } catch (e) {
            return false;
        }
    }

    async sync(fromDate: Date, toDate: Date, options: { fullSync?: boolean, limit?: number } = {}): Promise<ConnectorResult> {
        const result: ConnectorResult = {
            success: false,
            importedCount: 0,
            errors: [],
            financeMetrics: [],
            productMetrics: [],
            rawOrders: [] // Populate rawOrders for SyncService
        };

        try {
            const limit = options.limit || 250;
            const orders = await this.fetchOrders(fromDate, toDate, limit);

            // Populate rawOrders so SyncService can process them
            result.rawOrders = orders;

            // Basic Metrics Calculation (Legacy / Fallback)
            const dailyMap = new Map<string, { revenue: number, net: number, orders: number, refunds: number }>();

            orders.forEach(order => {
                const day = order.created_at.split('T')[0];
                const current = dailyMap.get(day) || { revenue: 0, net: 0, orders: 0, refunds: 0 };

                const gross = parseFloat(order.total_price);
                const refunds = order.refunds.reduce((acc: number, r: any) =>
                    acc + r.transactions.reduce((tAcc: number, t: any) => tAcc + parseFloat(t.amount), 0), 0);

                dailyMap.set(day, {
                    revenue: current.revenue + gross,
                    net: current.net + (gross - refunds),
                    orders: current.orders + 1,
                    refunds: current.refunds + refunds
                });
            });

            dailyMap.forEach((val, date) => {
                result.financeMetrics.push({
                    date: date,
                    revenueGross: val.revenue,
                    revenueNet: val.net,
                    ordersCount: val.orders,
                    refundsValue: val.refunds,
                });
            });

            result.success = true;
            result.importedCount = orders.length;

        } catch (error: any) {
            result.errors.push(error.message);
            result.success = false;
        }

        return result;
    }

    private async fetchOrders(from: Date, to: Date, limit: number): Promise<ShopifyOrder[]> {
        // Use updated_at_min to catch edits. Use limit.
        const url = `https://${this.shopDomain}/admin/api/2024-01/orders.json?status=any&updated_at_min=${from.toISOString()}&updated_at_max=${to.toISOString()}&limit=${limit}&order=updated_at desc`;

        const res = await fetch(url, {
            headers: {
                'X-Shopify-Access-Token': this.accessToken,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error(`Shopify API Error: ${res.statusText} (${res.status})`);

        const data = await res.json();
        return data.orders || [];
    }
}
