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
        // Validate access token via Graph API debug_token endpoint in real implementation
        return !!this.accessToken;
    }

    async sync(fromDate: Date, toDate: Date, options: { fullSync?: boolean } = {}): Promise<ConnectorResult> {
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

            // Real API Call
            // Note: AdAccount ID usually needs 'act_' prefix if not present.
            const accountId = this.adAccountId.startsWith('act_') ? this.adAccountId : `act_${this.adAccountId}`;
            const fields = 'spend,clicks,impressions,actions,action_values,date_start,date_stop';

            const url = `https://graph.facebook.com/v19.0/${accountId}/insights?level=account&time_increment=1&time_range={'since':'${startDate}','until':'${endDate}'}&fields=${fields}&access_token=${this.accessToken}`;

            const res = await fetch(url);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(`Meta API Error: ${errData.error?.message || res.statusText}`);
            }

            const data = await res.json();
            const apiData = data.data || [];

            const normalizedAds = apiData.map((row: any) => {
                const spend = parseFloat(row.spend || '0');

                // Extract purchase value (customizable in future, mostly 'purchase' or 'offsite_conversion.fb_pixel_purchase')
                const purchaseAction = row.actions?.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');
                const purchaseValueAction = row.action_values?.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');

                const conversions = parseInt(purchaseAction?.value || '0');
                const conversionValue = parseFloat(purchaseValueAction?.value || '0');

                return {
                    date: row.date_start,
                    channel: 'meta_ads',
                    spend: spend,
                    impressions: parseInt(row.impressions || '0'),
                    clicks: parseInt(row.clicks || '0'),
                    conversions: conversions,
                    conversionValue: conversionValue,
                    roas: spend > 0 ? conversionValue / spend : 0,
                    cpa: conversions > 0 ? spend / conversions : 0
                };
            });

            (result as any).adsMetrics = normalizedAds;
            result.success = true;
            result.importedCount = normalizedAds.length;

        } catch (error: any) {
            console.error("Meta Sync Error", error);
            result.errors.push(error.message);
            result.success = false;
        }

        return result;
    }
}
