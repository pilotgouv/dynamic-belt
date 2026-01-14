import { FinanceDailyMetric, ProductDailyMetric } from "@/types/data";

export interface ConnectorResult {
    success: boolean;
    importedCount: number;
    errors: string[];
    financeMetrics: Partial<FinanceDailyMetric>[];
    productMetrics: Partial<ProductDailyMetric>[];
    adsMetrics?: any[];
    trafficMetrics?: any[];
}

export interface DataSourceConnector {
    provider: string;
    connect(credentials: any): Promise<boolean>;
    sync(fromDate: Date, toDate: Date): Promise<ConnectorResult>;
    validateToken(): Promise<boolean>;
}
