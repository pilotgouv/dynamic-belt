import { DataSourceConnector, ConnectorResult } from "./types";

// Types specific to Shopify API responses
interface ShopifyOrder {
    id: number;
    created_at: string;
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
    private accessToken: string;
    private shopDomain: string;

    constructor(accessToken: string, shopDomain: string) {
        this.accessToken = accessToken;
        this.shopDomain = shopDomain;
    }

    async connect(credentials: any): Promise<boolean> {
        // In a real scenario, this would exchange an auth code for a token
        // For V2 prototype, we validate the existing token
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

    async sync(fromDate: Date, toDate: Date): Promise<ConnectorResult> {
        const result: ConnectorResult = {
            success: false,
            importedCount: 0,
            errors: [],
            financeMetrics: [],
            productMetrics: []
        };

        try {
            // 1. Fetch Orders from Shopify
            // Note: Real implementation handles pagination
            const orders = await this.fetchOrders(fromDate, toDate);

            // 2. Normalize Data daily
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

            // 3. Transform to FinanceMetrics
            dailyMap.forEach((val, date) => {
                result.financeMetrics.push({
                    date: date,
                    revenueGross: val.revenue,
                    revenueNet: val.net,
                    ordersCount: val.orders,
                    refundsValue: val.refunds,
                    // Profit/Margin calculated in Engine, not here (Separation of Concerns)
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

    private async fetchOrders(from: Date, to: Date): Promise<ShopifyOrder[]> {
        // Basic Fetch Implementation
        const url = `https://${this.shopDomain}/admin/api/2024-01/orders.json?status=any&created_at_min=${from.toISOString()}&created_at_max=${to.toISOString()}&limit=250`;

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
