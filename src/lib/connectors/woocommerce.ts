import { DataSourceConnector, ConnectorResult, ConnectorCapability } from "./types";

export class WooCommerceConnector implements DataSourceConnector {
    provider = 'woocommerce';
    capabilities: ConnectorCapability[] = ['sales', 'refunds'];
    private storeUrl: string;
    private consumerKey: string;
    private consumerSecret: string;

    constructor(storeUrl: string, consumerKey: string, consumerSecret: string) {
        let url = storeUrl.replace(/\/$/, "");
        if (!url.startsWith("http")) {
            url = `https://${url}`;
        }
        this.storeUrl = url;
        this.consumerKey = consumerKey;
        this.consumerSecret = consumerSecret;
    }

    async connect(credentials: any): Promise<boolean> {
        return await this.validateToken();
    }

    private buildUrl(path: string, params: Record<string, string | number | boolean | undefined>) {
        const url = new URL(`${this.storeUrl}${path}`);
        url.searchParams.set("consumer_key", this.consumerKey);
        url.searchParams.set("consumer_secret", this.consumerSecret);

        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        });
        return url.toString();
    }

    async validateToken(): Promise<boolean> {
        try {
            const url = this.buildUrl("/wp-json/wc/v3/system_status", {});
            const res = await fetch(url);
            return res.status === 200;
        } catch (e) {
            return false;
        }
    }

    async sync(fromDate: Date, toDate: Date, options: { deepSync?: boolean, fullSync?: boolean, limit?: number, onProgress?: (msg: string, pct?: number) => void } = {}): Promise<ConnectorResult> {
        const result: ConnectorResult = {
            success: false,
            importedCount: 0,
            errors: [],
            financeMetrics: [],
            productMetrics: [],
            rawOrders: []
        };

        const allOrders: any[] = [];
        let page = 1;
        let hasMore = true;

        const isDeepSync = options.deepSync || options.fullSync || fromDate.getFullYear() <= 2020;
        const limit = options.limit || 0;
        const progressCb = options.onProgress || ((m, p) => { });

        console.log(`[WooCommerce] Starting Sync. Deep: ${isDeepSync}, Limit: ${limit}. From ${fromDate.toISOString()}`);
        progressCb('Preparation...', 15);

        try {
            const MAX_PAGES = isDeepSync ? 500 : (limit > 0 ? 1 : 20);

            while (hasMore && page <= MAX_PAGES) {
                const queryParams: Record<string, string | number | boolean | undefined> = {
                    per_page: limit > 0 ? limit.toString() : '100',
                    page: page.toString(),
                    order: 'desc', // Always newest first
                    orderby: 'modified' // Track modifications!
                };

                if (!isDeepSync) {
                    // Use modified_after for incremental
                    queryParams.modified_after = fromDate.toISOString().split('.')[0];
                }

                // If limit is set (Check Mode), we don't strictly need Date filter if we just want "Latest Modified" 
                // BUT for "Sync Delta", we need modified_after.
                // Assuming limit=1 is used for "Get Latest Global".
                // If options.limit > 0, we might want to ignore date filter if checking global max? 
                // The User Spec says: "Check limit=1 sorted by modified desc". 
                // If I pass fromDate=Cursor, and limit=1, I check if there is ANY order modified after cursor.
                // If result is empty -> No new data.
                // Works perfectly.

                const url = this.buildUrl("/wp-json/wc/v3/orders", queryParams);

                console.log(`[WooCommerce] Fetching Page ${page}. Url: ${url.replace(this.consumerSecret, '***')}`);

                let res;
                let retries = 0;
                while (retries < 3) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 30000);
                        res = await fetch(url, { signal: controller.signal });
                        clearTimeout(timeoutId);
                        if (res.ok) break;
                        throw new Error(`Status ${res.status}`);
                    } catch (e: any) {
                        retries++;
                        await new Promise(r => setTimeout(r, 2000 * retries));
                    }
                }

                if (!res || !res.ok) throw new Error(`WooCommerce API Failed`);

                const pageOrders = await res.json();

                if (Array.isArray(pageOrders)) {
                    allOrders.push(...pageOrders);

                    if (limit > 0 && allOrders.length >= limit) {
                        hasMore = false;
                    } else if (pageOrders.length < 100) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                }
            }

            result.rawOrders = allOrders; // Important!

            // Normalize (Should handle variations in metrics if needed, but SyncService handles DB Upsert)
            // We still populate metrics for immediate feedback if needed, but primary logic is now in SyncService.
            // ... (Keep existing Metric Calculation logic for robustness)

            const dailyMap = new Map<string, any>();
            allOrders.forEach((order: any) => {
                const day = (order.date_created || order.date_modified).split('T')[0];
                const gross = parseFloat(order.total);
                const current = dailyMap.get(day) || { revenue: 0, net: 0, orders: 0 };
                dailyMap.set(day, {
                    revenue: current.revenue + gross,
                    orders: current.orders + 1
                });
            });

            dailyMap.forEach((val, date) => {
                result.financeMetrics.push({
                    date,
                    revenueGross: val.revenue,
                    revenueNet: val.revenue, // Approx
                    ordersCount: val.orders,
                    refundsValue: 0
                });
            });

            result.success = true;
            result.importedCount = allOrders.length;

            // Catalog Fetch (Only if NOT a Limit Check)
            // Catalog Fetch (Full Sync or Catalog Check)
            // Logic: If limit=1 (Check Mode), we skip.
            // If FullSync, we fetch ALL.
            // If QuickSync, we fetch Modified.
            if ((!options.limit || options.limit !== 1)) {

                const products: any[] = [];
                let pPage = 1;
                let pHasMore = true;
                // Safety Cap for now to avoid timeout on Vercel (Time limit 10s-60s)
                // If deep sync, we might hit limits. Recommended to use Background Jobs or cursor.
                // For MVP, limit to 5 pages (500 products).
                const P_MAX_PAGES = isDeepSync ? 20 : 5;

                while (pHasMore && pPage <= P_MAX_PAGES) {
                    const pParams: any = {
                        per_page: '100',
                        page: pPage.toString(),
                        order: 'desc',
                        orderby: 'modified'
                    };
                    if (!isDeepSync) {
                        // Incremental: Modified after last sync
                        pParams.modified_after = fromDate.toISOString();
                    }

                    console.log(`[Woo] Fetching Products Page ${pPage}...`);
                    progressCb(`Récupération Catalogue Page ${pPage}/${P_MAX_PAGES}...`, 20 + Math.round((pPage / P_MAX_PAGES) * 20)); // 20-40%
                    try {
                        const pUrl = this.buildUrl("/wp-json/wc/v3/products", pParams);
                        const pRes = await fetch(pUrl);
                        if (pRes.ok) {
                            const batch = await pRes.json();
                            if (Array.isArray(batch) && batch.length > 0) {
                                // Parallelize Variation Fetching (Batch 5)
                                const fetchVariations = async (p: any) => {
                                    if (p.type === 'variable' || (p.variations && p.variations.length > 0)) {
                                        try {
                                            const vUrl = this.buildUrl(`/wp-json/wc/v3/products/${p.id}/variations`, { per_page: '100' });
                                            // Add 1s delay jitter to avoid pure burst
                                            // await new Promise(r => setTimeout(r, Math.random() * 500)); 
                                            const vRes = await fetch(vUrl);
                                            if (vRes.ok) {
                                                const vars = await vRes.json();
                                                if (Array.isArray(vars)) {
                                                    return vars.map((v: any) => ({ ...v, is_variation: true, parent_title: p.name }));
                                                }
                                            }
                                        } catch (ev) { console.error(`Var Fetch Fail ${p.id}`, ev); }
                                    }
                                    return [];
                                };

                                // Batch Array
                                const chunks = [];
                                const CHUNK_SIZE = 5;
                                for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
                                    chunks.push(batch.slice(i, i + CHUNK_SIZE));
                                }

                                for (const chunk of chunks) {
                                    // Process chunk parallel
                                    const results = await Promise.all(chunk.map(async (p: any) => {
                                        products.push(p);
                                        return await fetchVariations(p);
                                    }));
                                    // flattening results and pushing to products
                                    results.flat().forEach(v => products.push(v));
                                }

                                if (batch.length < 100) pHasMore = false;
                                else pPage++;
                            } else {
                                pHasMore = false;
                            }
                        } else {
                            pHasMore = false;
                        }
                    } catch (ep) {
                        console.error("Prod Fetch Fail", ep);
                        pHasMore = false;
                    }
                }
                result.rawProducts = products;
            }

        } catch (error: any) {
            result.errors.push(error.message);
            result.success = false;
        }

        return result;
    }
}
