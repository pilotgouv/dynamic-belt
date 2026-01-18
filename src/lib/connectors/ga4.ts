import { JWT } from 'google-auth-library';

export class GA4Connector {
    private client: JWT;
    private propertyId: string;
    private projectId?: string;

    constructor(credentials: any) {
        if (!credentials.clientEmail || !credentials.privateKey || !credentials.propertyId) {
            throw new Error("Missing GA4 Credentials (clientEmail, privateKey, or propertyId)");
        }

        // Clean keys just in case (replace escaped newlines if coming from JSON string sometimes)
        const privateKey = credentials.privateKey.includes('\\n')
            ? credentials.privateKey.replace(/\\n/g, '\n')
            : credentials.privateKey;

        this.propertyId = String(credentials.propertyId);
        this.projectId = credentials.projectId;

        this.client = new JWT({
            email: credentials.clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
        });
    }

    async validate(): Promise<boolean> {
        try {
            await this.client.authorize();
            // Test RunReport (Last 1 day)
            const res = await this.client.request({
                url: `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
                method: 'POST',
                data: {
                    dateRanges: [{ startDate: 'today', endDate: 'today' }],
                    metrics: [{ name: 'sessions' }],
                    limit: 1
                }
            });
            return res.status === 200;
        } catch (e: any) {
            console.error("GA4 Validation Failed:", e.message);
            throw new Error(`GA4 Connection Failed: ${e.message}`);
        }
    }

    async sync(from: Date, to: Date, options: { limit?: number, onProgress?: (msg: string) => void } = {}) {
        await this.client.authorize();

        const startDate = from.toISOString().split('T')[0];
        const endDate = to.toISOString().split('T')[0];

        // Fetch Daily Traffic Metrics
        // Dimensions: date, source, medium
        // Metrics: sessions, totalUsers, conversions, engagementRate

        if (options.onProgress) options.onProgress("Fetching GA4 Report...");

        const response = await this.client.request({
            url: `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
            method: 'POST',
            data: {
                dateRanges: [{ startDate, endDate }],
                dimensions: [
                    { name: 'date' },
                    { name: 'sessionSource' }, // "Google", "Direct"
                    { name: 'sessionMedium' }  // "cpc", "organic"
                ],
                metrics: [
                    { name: 'sessions' },
                    { name: 'totalUsers' },
                    { name: 'conversions' }, // Key event count
                    { name: 'engagementRate' }
                ],
                limit: 10000 // Max limit
            }
        });

        const data: any = response.data;

        if (!data.rows) {
            return { success: true, trafficMetrics: [], importedCount: 0 };
        }

        const metrics = data.rows.map((row: any) => {
            const date = row.dimensionValues[0].value; // YYYYMMDD string usually from GA4 API?
            // Wait, Data API date format: 'YYYYMMDD'. 
            // Need to parse.
            const y = date.substring(0, 4);
            const m = date.substring(4, 6);
            const d = date.substring(6, 8);
            const dateObj = new Date(`${y}-${m}-${d}`);

            return {
                date: dateObj,
                source: row.dimensionValues[1].value,
                medium: row.dimensionValues[2].value,
                sessions: parseInt(row.metricValues[0].value),
                users: parseInt(row.metricValues[1].value),
                conversions: parseInt(row.metricValues[2].value),
                engagementRate: parseFloat(row.metricValues[3].value)
            };
        });

        return {
            success: true,
            trafficMetrics: metrics,
            importedCount: metrics.length
        };
    }
}
