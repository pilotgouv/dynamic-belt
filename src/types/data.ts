export type CurrencyCode = 'EUR' | 'USD' | 'GBP';

// 1. User & Settings
export interface UserSettings {
    currency: CurrencyCode;
    // Fiscal
    vatEnabled: boolean;
    vatMode: 'HT' | 'TTC';
    vatRate: number;
    socialChargesEnabled?: boolean;
    socialChargesPercent?: number;
    incomeTaxEnabled?: boolean;
    incomeTaxPercent?: number;
    // Costs
    shippingCostMode: 'NONE' | 'FIXED_PER_ORDER' | 'PERCENT_REVENUE';
    shippingCostValue: number;
    paymentFeePercent: number;
    paymentFeeFixed: number;
    // Data Behavior
    dataMode: 'STRICT' | 'ESTIMATE';
    estimateCogsFallback: number;
    // Targets
    targets: {
        minRoas: number;
        minMargin: number;
    };
}

// 2. Normalized Data Models

export interface FinanceDailyMetric {
    date: string; // ISO YYYY-MM-DD
    revenueGross: number;
    revenueNet: number; // after refunds
    adSpendTotal: number;
    costOfGoods?: number; // Calculated or from Source
    shippingCost?: number; // Calculated or from Source
    transactionFees?: number; // Calculated or from Source
    profitEstimated: number;
    profitMarginPercent: number;
    ordersCount: number;
    refundsValue?: number;
}

export interface AdsChannelMetric {
    date: string;
    channel: 'google_ads' | 'meta_ads' | 'tiktok_ads' | 'other';
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    conversionValue: number;
    roas: number;
    cpa: number;
}

export interface TrafficSourceMetric {
    date: string;
    source: string;
    medium: string;
    sessions: number;
    users: number;
    bounceRate: number;
    conversionRate: number;
    revenueAttributed: number;
}

export interface ProductDailyMetric {
    date: string;
    sku: string;
    name: string;
    unitsSold: number;
    revenue: number;
    refunds?: number;
    marginEstimated?: number;
    profitEstimated?: number;
    status?: 'hero' | 'toxic' | 'sleeper' | 'normal';
}

// 3. Connection State
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'syncing';

export interface IntegrationConnection {
    id: string;
    provider: 'shopify' | 'woocommerce' | 'amazon' | 'google_ads' | 'meta_ads' | 'tiktok_ads' | 'ga4';
    name: string;
    status: ConnectionStatus;
    lastSyncAt?: string;
    error?: string;
    config?: Record<string, any>;
}
