import { DataSourceConnector, ConnectorResult, ConnectorCapability, DailyAdMetric } from "./types";

interface TikTokCredentials {
    appId: string;
    appSecret: string;
    accessToken: string;
    advertiserId: string;
}

export class TikTokAdsConnector implements DataSourceConnector {
    provider = 'tiktok_ads';
    capabilities: ConnectorCapability[] = ['ads'];
    private credentials: TikTokCredentials;

    constructor(credentials: any) {
        this.credentials = {
            appId: credentials.appId,
            appSecret: credentials.appSecret,
            accessToken: credentials.accessToken,
            advertiserId: credentials.advertiserId
        };
    }

    async connect(credentials: any): Promise<boolean> {
        this.credentials = credentials;
        return await this.validateToken();
    }

    async validateToken(): Promise<boolean> {
        // Validate by listing advertisers or checking basic info
        // GET /v1.3/oauth2/advertiser/get/
        try {
            const url = `https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/?app_id=${this.credentials.appId}&secret=${this.credentials.appSecret}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Access-Token': this.credentials.accessToken }
            });
            const data = await res.json();
            if (data.code === 0 && data.data?.list?.length > 0) {
                // Check if our advertiserId is in the list
                // const valid = data.data.list.find(a => a.advertiser_id === this.credentials.advertiserId);
                return true;
            }
            console.error('TikTok Validate Failed:', data);
            return false;
        } catch (e) {
            console.error('TikTok Validate Error:', e);
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
            const startDate = fromDate.toISOString().split('T')[0];
            const endDate = toDate.toISOString().split('T')[0];

            // Reporting API
            // GET /v1.3/report/integrated/get/
            // metrics: spend, impressions, clicks, conversion, cpc
            // dimensions: stat_time_day, campaign_id, campaign_name

            const formattedMetrics = JSON.stringify(["spend", "impressions", "clicks", "conversion", "conversion_rate", "real_time_conversion", "cpc", "cpm"]);
            const formattedDimensions = JSON.stringify(["stat_time_day", "campaign_name"]);

            const qs = new URLSearchParams({
                advertiser_id: this.credentials.advertiserId,
                report_type: 'BASIC',
                data_level: 'AUCTION_CAMPAIGN', // Campaign level
                dimensions: formattedDimensions,
                metrics: formattedMetrics,
                start_date: startDate,
                end_date: endDate,
                page_size: '200'
            });

            const url = `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?${qs.toString()}`;

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Access-Token': this.credentials.accessToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error(`TikTok API Error: ${res.status}`);
            }

            const data = await res.json();
            if (data.code !== 0) {
                throw new Error(`TikTok API Error Code ${data.code}: ${data.message}`);
            }

            const list = data.data?.list || [];

            const adsData: DailyAdMetric[] = list.map((row: any) => ({
                date: row.dimensions.stat_time_day.split(' ')[0], // "2023-01-01 00:00:00" -> 2023-01-01
                channel: 'tiktok_ads',
                campaign: row.dimensions.campaign_name,
                spend: parseFloat(row.metrics.spend),
                impressions: parseInt(row.metrics.impressions),
                clicks: parseInt(row.metrics.clicks),
                conversions: parseInt(row.metrics.conversion), // or real_time_conversion
                conversionValue: 0, // TikTok doesn't always return value easily in integrated report without Pixel setup
                roas: 0
            })).map((m: any) => ({
                ...m,
                cpa: m.conversions > 0 ? m.spend / m.conversions : 0
            }));

            result.adsMetrics = adsData;
            result.importedCount = adsData.length;
            result.success = true;

        } catch (e: any) {
            console.error('TikTok Sync Error', e);
            result.errors.push(e.message);
        }

        return result;
    }
}
