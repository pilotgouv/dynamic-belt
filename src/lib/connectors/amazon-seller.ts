import { DataSourceConnector, ConnectorResult, ConnectorCapability } from './types';
import aws4 from 'aws4';
import { randomUUID } from 'crypto';

interface AmazonCredentials {
    region: 'EU' | 'NA' | 'FE';
    marketplaceIds: string[];
    lwaClientId: string;
    lwaClientSecret: string;
    lwaRefreshToken: string;
    awsAccessKeyId: string;
    awsSecretAccessKey: string;
    awsRoleArn?: string; // Optional assume role
}

export class AmazonSellerConnector implements DataSourceConnector {
    provider = 'amazon_seller';
    capabilities: ConnectorCapability[] = ['sales', 'fees', 'inventory', 'settlement'];

    private credentials: AmazonCredentials;
    private accessToken: string | null = null;
    private accessTokenExpiry: number = 0;

    constructor(credentials: any) {
        this.credentials = credentials as AmazonCredentials;
    }

    private getEndpoint() {
        switch (this.credentials.region) {
            case 'EU': return 'sellingpartnerapi-eu.amazon.com';
            case 'NA': return 'sellingpartnerapi-na.amazon.com';
            case 'FE': return 'sellingpartnerapi-fe.amazon.com';
            default: return 'sellingpartnerapi-eu.amazon.com';
        }
    }

    private getAwsRegion() {
        switch (this.credentials.region) {
            case 'EU': return 'eu-west-1';
            case 'NA': return 'us-east-1';
            case 'FE': return 'us-west-2';
            default: return 'eu-west-1';
        }
    }

    async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.accessTokenExpiry) {
            return this.accessToken;
        }

        const url = 'https://api.amazon.com/auth/o2/token';
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.credentials.lwaRefreshToken,
            client_id: this.credentials.lwaClientId,
            client_secret: this.credentials.lwaClientSecret
        });

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`LWA Refresh Failed: ${res.status} ${err}`);
        }

        const data = await res.json();
        this.accessToken = data.access_token;
        this.accessTokenExpiry = Date.now() + (data.expires_in * 1000) - 30000; // Buffer 30s
        return this.accessToken!;
    }

    async signedRequest(path: string, method: string = 'GET', query?: Record<string, string>, body?: any) {
        const host = this.getEndpoint();
        const region = this.getAwsRegion();
        const accessToken = await this.getAccessToken();

        // Prepare path with query
        let pathWithQuery = path;
        if (query) {
            const qs = new URLSearchParams(query).toString();
            pathWithQuery += `?${qs}`;
        }

        const opts: any = {
            host,
            path: pathWithQuery,
            method,
            service: 'execute-api',
            region,
            headers: {
                'x-amz-access-token': accessToken,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            opts.body = JSON.stringify(body);
        }

        // Sign with AWS4
        // If Role ARN is present, we might need AssumeRole (STS) first.
        // For MVP, assuming IAM User has direct permissions or Long-lived creds.
        // Implementing basic AssumeRole is complex here without AWS SDK.
        // Using direct keys provided in credentials.

        aws4.sign(opts, {
            accessKeyId: this.credentials.awsAccessKeyId,
            secretAccessKey: this.credentials.awsSecretAccessKey
        });

        const url = `https://${host}${pathWithQuery}`;
        const res = await fetch(url, {
            method: opts.method,
            headers: opts.headers as any,
            body: opts.body
        });

        return res;
    }

    async validateToken(): Promise<boolean> {
        try {
            await this.getAccessToken();
            // Test call to Marketplaces
            const res = await this.signedRequest('/sellers/v1/marketplaceParticipations');
            if (res.status === 200) return true;
            console.error('Amazon Validate Failed:', res.status, await res.text());
            return false;
        } catch (e) {
            console.error('Amazon Validate Error:', e);
            return false;
        }
    }

    async connect(credentials: any): Promise<boolean> {
        this.credentials = credentials;
        return this.validateToken();
    }

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getOrderItems(orderId: string): Promise<any[]> {
        let allItems: any[] = [];
        let nextToken: string | undefined = undefined;

        do {
            const query: any = {};
            if (nextToken) query.NextToken = nextToken;

            // Basic throttle (naive)
            await this.sleep(400);

            const res = await this.signedRequest(`/orders/v0/orders/${orderId}/orderItems`, 'GET', query);

            if (res.status === 429) {
                console.log(`[Amazon] Rate Limit Items ${orderId}. Backoff 2s...`);
                await this.sleep(2000);
                continue;
            }

            if (!res.ok) {
                console.warn(`[Amazon] Failed to fetch items for ${orderId}: ${res.status}`);
                break;
            }

            const data = await res.json();
            const items = data.payload?.OrderItems || [];
            allItems.push(...items);
            nextToken = data.payload?.NextToken;

        } while (nextToken);

        return allItems;
    }

    async sync(fromDate: Date, toDate: Date, options: { fullSync?: boolean } = {}): Promise<ConnectorResult> {
        const result: ConnectorResult = {
            success: true,
            importedCount: 0,
            errors: [],
            financeMetrics: [],
            productMetrics: [],
            rawOrders: [],
            rawProducts: []
        };

        try {
            // 1. Fetch Orders
            let nextToken: string | undefined = undefined;
            const createdAfter = fromDate.toISOString();

            do {
                const query: any = {
                    CreatedAfter: createdAfter,
                    MarketplaceIds: this.credentials.marketplaceIds.join(','),
                    MaxResultsPerPage: '50' // Max 100
                };
                if (nextToken) query.NextToken = nextToken;

                const res = await this.signedRequest('/orders/v0/orders', 'GET', query);

                if (res.status === 429) {
                    await new Promise(r => setTimeout(r, 2000)); // Rate limit backoff
                    continue; // Retry same loop? ideally complex retry logic
                }

                if (!res.ok) {
                    throw new Error(`Order fetch failed: ${res.status} ${await res.text()}`);
                }

                const data = await res.json();
                const orders = data.payload?.Orders || [];

                // Map to Raw Orders
                for (const order of orders) {
                    const items = await this.getOrderItems(order.AmazonOrderId);

                    result.rawOrders?.push({
                        amazonOrderId: order.AmazonOrderId,
                        purchaseDate: order.PurchaseDate,
                        lastUpdateDate: order.LastUpdateDate,
                        orderStatus: order.OrderStatus,
                        fulfillmentChannel: order.FulfillmentChannel,
                        salesChannel: order.SalesChannel, // Added
                        numberOfItemsShipped: order.NumberOfItemsShipped,
                        numberOfItemsUnshipped: order.NumberOfItemsUnshipped,
                        orderTotal: order.OrderTotal ? {
                            amount: parseFloat(order.OrderTotal.Amount),
                            currency: order.OrderTotal.CurrencyCode
                        } : { amount: 0, currency: 'EUR' },
                        items: items
                    });
                }

                result.importedCount += orders.length;
                nextToken = data.payload?.NextToken;

            } while (nextToken);

            // TODO: Process Order Items (Batch or Restricted)
            // TODO: Aggregate FinanceMetrics from these Orders

            result.success = true;

        } catch (e: any) {
            result.success = false;
            result.errors.push(e.message);
            console.error('Amazon Sync Error', e);
        }

        return result;
    }

    async disconnect(): Promise<boolean> {
        // Nothing remote to do, just cleanup local
        return true;
    }
}
