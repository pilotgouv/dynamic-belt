import { DataSourceConnector, ConnectorResult, ConnectorCapability } from "./types";

interface GA4DailyRow {
    date: string; // YYYYMMDD
    sessionSource: string;
    sessionMedium: string;
    sessions: string;
    totalUsers: string;
    engagementRate: string; // 0-1 as string
    conversions: string;
    keyEvents: string; // e.g. add_to_cart
}

export class GA4Connector implements DataSourceConnector {
    provider = 'ga4';
    capabilities: ConnectorCapability[] = ['traffic'];
    private accessToken: string;
    private propertyId: string;

    constructor(accessToken: string, propertyId: string) {
        this.accessToken = accessToken;
        this.propertyId = propertyId;
    }

    async connect(credentials: any): Promise<boolean> {
        return await this.validateToken();
    }

    async validateToken(): Promise<boolean> {
        // Validation logic for Google token
        return !!this.accessToken;
    }

    async sync(fromDate: Date, toDate: Date): Promise<ConnectorResult> {
        const result: ConnectorResult = {
            success: false,
            importedCount: 0,
            errors: [],
            financeMetrics: [],
            productMetrics: [],
        };

        try {
            const startDate = fromDate.toISOString().split('T')[0];
            const endDate = toDate.toISOString().split('T')[0];

            // Real API Call
            const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [
                        { name: 'date' },
                        { name: 'sessionSource' },
                        { name: 'sessionMedium' }
                    ],
                    metrics: [
                        { name: 'sessions' },
                        { name: 'totalUsers' },
                        { name: 'engagementRate' },
                        { name: 'conversions' }
                    ]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`GA4 API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();

            if (!data.rows || data.rows.length === 0) {
                result.success = true;
                return result;
            }

            // Normalize Response
            const normalizedTraffic = data.rows.map((row: any) => ({
                date: this.parseDate(row.dimensionValues[0].value), // YYYYMMDD -> YYYY-MM-DD
                source: row.dimensionValues[1].value,
                medium: row.dimensionValues[2].value,
                sessions: parseInt(row.metricValues[0].value),
                users: parseInt(row.metricValues[1].value),
                engagementRate: parseFloat(row.metricValues[2].value),
                conversions: parseInt(row.metricValues[3].value),
                revenue: 0
            }));

            // Attach to result (using cast as trafficMetrics is added dynamically in types for now)
            (result as any).trafficMetrics = normalizedTraffic;
            result.success = true;
            result.importedCount = normalizedTraffic.length;

        } catch (error: any) {
            console.error("GA4 Sync Error:", error);
            result.errors.push(error.message);
        }

        return result;
    }

    private parseDate(d: string): string {
        // 20260114 -> 2026-01-14
        return `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
    }
}
