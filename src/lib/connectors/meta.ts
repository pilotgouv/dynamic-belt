import { DataSourceConnector, ConnectorResult, ConnectorCapability } from "./types";

export class MetaAdsConnector implements DataSourceConnector {
    provider = 'meta_ads';
    capabilities: ConnectorCapability[] = ['ads'];
    private accessToken: string;
    private adAccountId: string;

    constructor(accessToken: string, adAccountId: string) {
        this.accessToken = accessToken;
        this.adAccountId = adAccountId;
    }

    async connect(credentials: any): Promise<boolean> {
        return await this.validateToken();
    }

    async validateToken(): Promise<boolean> {
        try {
            const url = `https://graph.facebook.com/v19.0/debug_token?input_token=${this.accessToken}&access_token=${this.accessToken}`;
            const res = await fetch(url);
            if (!res.ok) return false;
            const json = await res.json();
            return json.data && json.data.is_valid;
        } catch (e) {
            console.error("Token Validation Failed", e);
            return false;
        }
    }

    async sync(fromDate: Date, toDate: Date, options?: any): Promise<ConnectorResult> {
        try {
            const startDate = fromDate.toISOString().split('T')[0];
            const endDate = toDate.toISOString().split('T')[0];

            if (options?.onProgress) options.onProgress("Synchronisation des campagnes...", 10);

            // 1. Fetch Entities
            const campaigns = await this.fetchCampaigns();

            if (options?.onProgress) options.onProgress("Téléchargement de la vue Plateforme...", 30);

            // 2. Vue Plateforme (Facebook vs Instagram) -> Feeds Dashboard
            const platformData = await this.fetchInsights(startDate, endDate, 'publisher_platform');

            if (options?.onProgress) options.onProgress("Téléchargement de la vue Device...", 60);

            // 3. Vue Device (Mobile vs Desktop) -> Feeds Granular Only
            const deviceData = await this.fetchInsights(startDate, endDate, 'device_platform');

            // 4. Transform for Dashboard (AdsDaily)
            // We use Platform Data as the source of truth for the Dashboard to separation (FB/Insta)
            const adsMetrics = this.mapToAdsDaily(platformData);

            // 5. Transform for Granular Storage (MetaInsight)
            const granularInsights = [
                ...this.mapToMetaInsights(platformData, 'PLATFORM'),
                ...this.mapToMetaInsights(deviceData, 'DEVICE')
            ];

            return {
                success: true,
                importedCount: granularInsights.length,
                errors: [],
                financeMetrics: [],
                productMetrics: [],
                adsMetrics: adsMetrics,
                rawMetaPayload: {
                    metaAccountId: this.adAccountId,
                    campaigns: campaigns,
                    insights: granularInsights
                }
            };

        } catch (error: any) {
            console.error("Meta Sync Error", error);
            return {
                success: false,
                importedCount: 0,
                errors: [error.message],
                financeMetrics: [],
                productMetrics: []
            };
        }
    }

    private async fetchCampaigns() {
        const accountId = this.adAccountId.startsWith('act_') ? this.adAccountId : `act_${this.adAccountId}`;
        const fields = 'id,name,status,objective,buying_type';
        const url = `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=${fields}&limit=500&access_token=${this.accessToken}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch campaigns");
        const json = await res.json();
        return json.data || [];
    }

    private async fetchInsights(start: string, end: string, breakdown: string) {
        const accountId = this.adAccountId.startsWith('act_') ? this.adAccountId : `act_${this.adAccountId}`;
        const fields = 'campaign_name,campaign_id,spend,clicks,impressions,cpc,cpm,ctr,actions,action_values,date_start,date_stop'; // reduced set

        const timeRange = JSON.stringify({ since: start, until: end });
        const url = `https://graph.facebook.com/v19.0/${accountId}/insights?level=campaign&time_increment=1&time_range=${encodeURIComponent(timeRange)}&fields=${fields}&breakdowns=${breakdown}&limit=500&access_token=${this.accessToken}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch insights (${breakdown})`);
        const json = await res.json();
        return json.data || []; // Handle pagination later if needed
    }

    private mapToAdsDaily(data: any[]) {
        return data.map((row: any) => {
            const spend = parseFloat(row.spend || '0');
            const purchaseAction = row.actions?.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');
            const purchaseValueAction = row.action_values?.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');
            const conversions = parseInt(purchaseAction?.value || '0');
            const conversionValue = parseFloat(purchaseValueAction?.value || '0');

            let channel = row.publisher_platform || 'meta_ads';
            if (channel === 'audience_network') channel = 'audience_net';

            return {
                date: row.date_start,
                provider: 'meta_ads',
                channel: channel,
                campaignId: row.campaign_id,
                campaignName: row.campaign_name,
                spend: spend,
                impressions: parseInt(row.impressions || '0'),
                clicks: parseInt(row.clicks || '0'),
                conversions: conversions,
                conversionValue: conversionValue,
                roas: spend > 0 ? conversionValue / spend : 0,
                cpa: conversions > 0 ? spend / conversions : 0
            };
        });
    }

    private mapToMetaInsights(data: any[], type: string) {
        return data.map((row: any) => {
            const spend = parseFloat(row.spend || '0');
            const purchaseAction = row.actions?.find((a: any) => a.action_type === 'purchase');
            const purchaseValueAction = row.action_values?.find((a: any) => a.action_type === 'purchase');

            return {
                date: row.date_start,
                campaignId: row.campaign_id,
                breakdownType: type,
                publisherPlatform: row.publisher_platform || null,
                devicePlatform: row.device_platform || null,

                spend: spend,
                impressions: parseInt(row.impressions || '0'),
                clicks: parseInt(row.clicks || '0'),
                ctr: parseFloat(row.ctr || '0'),
                cpc: parseFloat(row.cpc || '0'),
                cpm: parseFloat(row.cpm || '0'),

                actionsJson: row.actions || [],
                actionValuesJson: row.action_values || [],

                purchases: parseInt(purchaseAction?.value || '0'),
                purchaseValue: parseFloat(purchaseValueAction?.value || '0')
            };
        });
    }
}
