import { DataSourceConnector, ConnectorResult, ConnectorCapability, DailyAdMetric } from "./types";

interface GoogleAdsCredentials {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    developerToken: string;
    customerId: string; // The specific Ad Account ID (e.g. 123-456-7890)
    loginCustomerId?: string; // Optional MCC ID
}

export class GoogleAdsConnector implements DataSourceConnector {
    provider = 'google_ads';
    capabilities: ConnectorCapability[] = ['ads'];

    private credentials: GoogleAdsCredentials;
    private accessToken: string | null = null;
    private accessTokenExpiry: number = 0;

    constructor(credentials: any) {
        // Normalize credentials
        this.credentials = {
            clientId: credentials.clientId || credentials.oauthClientId,
            clientSecret: credentials.clientSecret || credentials.oauthClientSecret,
            refreshToken: credentials.refreshToken || credentials.oauthRefreshToken,
            developerToken: credentials.developerToken,
            customerId: credentials.customerId?.replace(/-/g, ''), // Remove dashes for API
            loginCustomerId: credentials.loginCustomerId?.replace(/-/g, '')
        };
    }

    async connect(credentials: any): Promise<boolean> {
        this.credentials = credentials;
        return await this.validateToken();
    }

    async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.accessTokenExpiry) {
            return this.accessToken;
        }

        const params = new URLSearchParams();
        params.append('client_id', this.credentials.clientId);
        params.append('client_secret', this.credentials.clientSecret);
        params.append('refresh_token', this.credentials.refreshToken);
        params.append('grant_type', 'refresh_token');

        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Google OAuth Refresh Failed: ${res.status} ${err}`);
        }

        const data = await res.json();
        this.accessToken = data.access_token;
        this.accessTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Buffer 1min
        return this.accessToken!;
    }

    async validateToken(): Promise<boolean> {
        try {
            await this.getAccessToken();
            // Lightweight call: List accessible customers
            // GET https://googleads.googleapis.com/v17/customers:listAccessibleCustomers
            const token = await this.getAccessToken();
            const res = await fetch('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'developer-token': this.credentials.developerToken
                }
            });

            if (res.ok) return true;

            console.error('Google Ads Validate Failed:', res.status, await res.text());
            return false;
        } catch (e) {
            console.error('Google Ads Validate Error:', e);
            return false;
        }
    }

    async sync(fromDate: Date, toDate: Date): Promise<ConnectorResult> {
        const result: ConnectorResult = {
            success: false,
            importedCount: 0,
            errors: [],
            financeMetrics: [],
            productMetrics: [],
            adsMetrics: []
        };

        try {
            const token = await this.getAccessToken();
            const startDate = fromDate.toISOString().split('T')[0];
            const endDate = toDate.toISOString().split('T')[0];

            // GAQL Query
            const query = `
                SELECT 
                    segments.date, 
                    campaign.name, 
                    metrics.cost_micros, 
                    metrics.impressions, 
                    metrics.clicks, 
                    metrics.conversions, 
                    metrics.conversions_value 
                FROM campaign 
                WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
            `;

            const url = `https://googleads.googleapis.com/v17/customers/${this.credentials.customerId}/googleAds:search`;

            const headers: any = {
                'Authorization': `Bearer ${token}`,
                'developer-token': this.credentials.developerToken,
                'Content-Type': 'application/json'
            };

            if (this.credentials.loginCustomerId) {
                headers['login-customer-id'] = this.credentials.loginCustomerId;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ query })
            });

            if (!res.ok) {
                throw new Error(`Google Ads API Error (${res.status}): ${await res.text()}`);
            }

            const data = await res.json();
            // Google Ads API returns a list of rows
            // If empty, results might be empty array or null payload?
            // "results": [ { "campaign":..., "metrics":..., "segments":... } ]

            const rows = data.results || [];

            const adsData: DailyAdMetric[] = rows.map((row: any) => ({
                date: row.segments.date,
                channel: 'google_ads',
                campaign: row.campaign.name,
                spend: parseFloat(row.metrics.costMicros || '0') / 1_000_000,
                impressions: parseInt(row.metrics.impressions || '0'),
                clicks: parseInt(row.metrics.clicks || '0'),
                conversions: parseFloat(row.metrics.conversions || '0'),
                conversionValue: parseFloat(row.metrics.conversionsValue || '0')
            })).map((m: any) => ({
                ...m,
                roas: m.spend > 0 ? m.conversionValue / m.spend : 0,
                cpa: m.conversions > 0 ? m.spend / m.conversions : 0
            }));

            result.adsMetrics = adsData;
            result.importedCount = adsData.length;
            result.success = true;

        } catch (e: any) {
            console.error('Google Ads Sync Error', e);
            result.errors.push(e.message);
        }

        return result;
    }
}
