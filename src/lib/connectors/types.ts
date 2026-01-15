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
    adsMetrics?: any[];
    trafficMetrics?: any[];

    // Normalized (Source of Truth)
    rawOrders?: any[];       // To be mapped to Order
    rawProducts?: any[];     // To be mapped to Product
    rawSettlements?: any[];  // To be mapped to SettlementEvent
    rawAdMetrics?: any[];    // To be mapped to AdDailyMetrics

    // Metadata updates
    providerMetadata?: Record<string, any>;
}

export interface DataSourceConnector {
    provider: string;
    capabilities: ConnectorCapability[];

    connect(credentials: any): Promise<boolean>;
    sync(fromDate: Date, toDate: Date, options?: { fullSync?: boolean }): Promise<ConnectorResult>;
    validateToken(): Promise<boolean>;
    disconnect?(): Promise<boolean>; // Cleanup
}
