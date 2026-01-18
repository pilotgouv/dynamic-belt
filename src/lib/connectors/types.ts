import { FinanceDailyMetric, ProductDailyMetric } from "@/types/data";
// We don't import Prisma types here to keep clean separation, but we mirror them
// effectively.

export type ConnectorCapability = 'sales' | 'ads' | 'refunds' | 'fees' | 'inventory' | 'settlement' | 'traffic';

export interface ConnectorResult {
    success: boolean;
    importedCount: number;
    errors: string[];

    // Aggregated (Legacy / Quick View)
    financeMetrics: Partial<FinanceDailyMetric>[];
    productMetrics: Partial<ProductDailyMetric>[];
    adsMetrics?: DailyAdMetric[]; // New: Ads specific metrics
    trafficMetrics?: any[];

    // Normalized (Source of Truth)
    rawOrders?: any[];       // To be mapped to Order
    rawProducts?: any[];     // To be mapped to Product
    rawSettlements?: any[];  // To be mapped to SettlementEvent
    rawAdMetrics?: any[];    // To be mapped to AdDailyMetrics

    // Metadata updates
    providerMetadata?: Record<string, any>;

    // Granular Meta Payload ("Pilot-ready")
    rawMetaPayload?: {
        metaAccountId?: string;
        campaigns: any[];
        insights: any[];
    };
}

export interface DataSourceConnector {
    provider: string;
    capabilities: ConnectorCapability[];

    connect(credentials: any): Promise<boolean>;
    sync(fromDate: Date, toDate: Date, options?: { fullSync?: boolean, deepSync?: boolean, limit?: number, onProgress?: (msg: string, pct?: number) => void }): Promise<ConnectorResult>;
    validateToken(): Promise<boolean>;
    disconnect?(): Promise<boolean>; // Cleanup
}

export interface DailyAdMetric {
    date: string;       // YYYY-MM-DD
    channel: string;    // google_ads, meta_ads, tiktok_ads
    campaign?: string;
    adGroup?: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    conversionValue: number;
    roas?: number;
    cpa?: number;
}
