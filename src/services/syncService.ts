import { prisma } from "@/lib/prisma";
import { ShopifyConnector } from "@/lib/connectors/shopify";
import { GoogleAdsConnector } from "@/lib/connectors/googleAds";
import { GA4Connector } from "@/lib/connectors/ga4";
import { TikTokAdsConnector } from "@/lib/connectors/tiktok";
import { BusinessEngine } from "@/lib/engine";
import { AlertService } from "@/services/alertService";
import { ConnectionService } from "@/lib/connections/connection-service";

export class SyncService {

    static async syncConnection(connectionId: string, connectionEntity?: any, options: { fullSync?: boolean, jobId?: string, skipRecalc?: boolean } = {}) {
        let connection = connectionEntity;

        const updateJobProgress = async (pct: number, msg: string) => {
            if (options.jobId) {
                try { await prisma.syncJob.update({ where: { id: options.jobId }, data: { message: msg } }); } catch (e) { }
            }
        };

        if (!connection || !connection.organization) {
            connection = await prisma.connection.findUnique({
                where: { id: connectionId },
                include: { organization: { include: { settings: true } } }
            });
        }

        if (!connection || !connection.credentialsEncrypted || !connection.organization.settings) {
            throw new Error("Connection invalid or Organization settings missing.");
        }

        const now = Date.now();
        const settings = connection.organization.settings;

        // --- 1. Credentials ---
        let credentials;
        try {
            credentials = ConnectionService.getDecryptedCredentials(connection);
        } catch (e) {
            await ConnectionService.markConnectionError(connectionId, "Decryption failed");
            throw e;
        }

        // --- 2. Connector Init ---
        let connector: any;
        if (connection.provider === 'SHOPIFY') {
            connector = new ShopifyConnector(credentials.accessToken, credentials.shopDomain);
        } else if (connection.provider === 'WOOCOMMERCE') {
            const { WooCommerceConnector } = await import('@/lib/connectors/woocommerce');
            connector = new WooCommerceConnector(credentials.storeUrl, credentials.consumerKey, credentials.consumerSecret);
        } else if (connection.provider === 'AMAZON_SELLER') {
            const { AmazonSellerConnector } = await import('@/lib/connectors/amazon-seller');
            connector = new AmazonSellerConnector(credentials);
        } else if (connection.provider === 'META_ADS') {
            const { MetaAdsConnector } = await import('@/lib/connectors/meta');
            connector = new MetaAdsConnector(credentials.accessToken, credentials.adAccountId);
        } else if (connection.provider === 'GOOGLE_ADS') {
            connector = new GoogleAdsConnector(credentials);
        } else if (connection.provider === 'GA4') {
            connector = new GA4Connector(credentials);
        } else if (connection.provider === 'TIKTOK_ADS') {
            connector = new TikTokAdsConnector(credentials);
        } else {
            throw new Error(`Provider ${connection.provider} not supported.`);
        }

        // --- 3. Start Log ---
        const log = await prisma.syncLog.create({
            data: {
                connectionId: connection.id,
                organizationId: connection.organizationId,
                status: 'running',
                provider: connection.provider as any,
                startedAt: new Date(),
                details: JSON.stringify({ stage: 'starting', percent: 5, message: 'Initialisation...' })
            }
        });

        const updateProgress = async (stage: string, percent: number, msg: string) => {
            await prisma.syncLog.update({ where: { id: log.id }, data: { details: JSON.stringify({ stage, percent, message: msg, timestamp: Date.now() }) } });
            if (options.jobId) {
                try { await prisma.syncJob.update({ where: { id: options.jobId }, data: { message: msg, progress: percent } }); } catch (e) { }
            }
        };

        try {
            // --- 4. Strategy: Check vs Full ---
            let fromDate = new Date();
            const toDate = new Date();

            let cursor = connection.lastCursor || null;

            if (!cursor || options.fullSync) {
                const legacyLast = connection.lastFullSyncAt || connection.lastSyncAt;
                if (!options.fullSync && legacyLast) {
                    fromDate = new Date(legacyLast);
                } else {
                    fromDate = new Date();
                    fromDate.setFullYear(fromDate.getFullYear() - 2);
                }
            } else {
                fromDate = new Date(cursor);
            }

            console.log(`[Sync] ${connection.provider} | Full: ${options.fullSync} | From: ${fromDate.toISOString()}`);

            // --- PHASE A: QUICK CHECK (Incremental Only) ---
            if (!options.fullSync) {
                await updateProgress('checking', 10, 'Vérification des nouveautés...');
                const checkResult = await connector.sync(fromDate, toDate, { limit: 1, onProgress: (msg: string) => updateProgress('checking', 10, msg) });

                // Check if ANY data returned
                const hasOrders = checkResult.rawOrders && checkResult.rawOrders.length > 0;
                const hasTraffic = checkResult.trafficMetrics && checkResult.trafficMetrics.length > 0;
                const hasAds = checkResult.adsMetrics && checkResult.adsMetrics.length > 0;

                if (checkResult.success && !hasOrders && !hasTraffic && !hasAds) {
                    if (checkResult.importedCount === 0) {
                        console.log("[Sync] Fast Exit: No new data found.");
                        await updateProgress('done', 100, 'Tout est à jour.');
                        await prisma.syncLog.update({
                            where: { id: log.id },
                            data: {
                                status: 'success', finishedAt: new Date(), durationMs: Date.now() - now, itemsImported: 0,
                                details: JSON.stringify({ stage: 'done', percent: 100, message: 'Tout est à jour.', timestamp: Date.now() })
                            }
                        });
                        await prisma.connection.update({
                            where: { id: connection.id },
                            data: { status: 'ACTIVE', lastSyncAt: new Date(), lastQuickSyncAt: new Date(), lastSyncStatus: 'success', errorMessage: null }
                        });
                        return { success: true, importedCount: 0 };
                    }
                }
            }

            // --- PHASE B: SYNC DELTA ---
            await updateProgress('fetching', 20, 'Téléchargement des données...');

            const result = await connector.sync(fromDate, toDate, {
                fullSync: options.fullSync,
                deepSync: options.fullSync,
                onProgress: (msg: string, pct?: number) => updateProgress('fetching', pct || 20, msg)
            });

            if (!result.success) {
                throw new Error(result.errors.join(', '));
            }

            let importedCount = result.importedCount;

            // --- PHASE C: PROCESSING ORDERS ---
            if (result.rawOrders && result.rawOrders.length > 0) {
                await updateProgress('upserting', 50, `Sauvegarde de ${result.rawOrders.length} commandes...`);
                let maxModified = new Date(0);
                const BATCH_SIZE = 15;
                const chunks = [];
                for (let j = 0; j < result.rawOrders.length; j += BATCH_SIZE) {
                    chunks.push(result.rawOrders.slice(j, j + BATCH_SIZE));
                }

                let processedCount = 0;
                for (const chunk of chunks) {
                    await Promise.all(chunk.map(async (order: any) => {
                        await this.processOrder(order, connection);
                        const modDateRaw = order.updated_at || order.date_modified || order.LastUpdateDate || order.created_at;
                        const modDate = new Date(modDateRaw);
                        if (modDate > maxModified) maxModified = modDate;
                    }));
                    processedCount += chunk.length;
                    if (options.jobId) await updateProgress('upserting', 50 + Math.round((processedCount / result.rawOrders.length) * 30), `Traitement commande ${processedCount}/${result.rawOrders.length}`);
                }
                if (maxModified.getTime() > 0) cursor = maxModified.toISOString();
            }

            // --- PHASE D: CATALOG & METRICS ---
            if (result.rawProducts && result.rawProducts.length > 0) {
                await updateProgress('upserting', 70, `Sauvegarde de ${result.rawProducts.length} produits...`);
                const pChunks = [];
                const P_BATCH = 20;
                for (let i = 0; i < result.rawProducts.length; i += P_BATCH) pChunks.push(result.rawProducts.slice(i, i + P_BATCH));
                let pDone = 0;
                for (const ch of pChunks) {
                    await Promise.all(ch.map((p: any) => this.processProduct(p, connection)));
                    pDone += ch.length;
                }
            }

            // --- PROCESS ADS METRICS ---
            if (result.adsMetrics && result.adsMetrics.length > 0) {
                await updateProgress('upserting', 80, `Sauvegarde des performances pubs...`);
                await SyncService.processAds(result.adsMetrics, connection);
            }

            // --- PROCESS GRANULAR META (Pilot-ready) ---
            if (result.rawMetaPayload) {
                await updateProgress('upserting', 85, `Détails Meta Ads...`);
                await SyncService.processGranularMeta(result.rawMetaPayload, connection);
            }

            // --- PROCESS TRAFFIC METRICS ---
            if (result.trafficMetrics && result.trafficMetrics.length > 0) {
                await updateProgress('upserting', 80, `Analytics trafic...`);
                await SyncService.processTraffic(result.trafficMetrics, connection, (msg: string) => updateProgress('upserting', 80, msg), options.jobId);
            }

            // Collect Impacted Dates
            const impacted = new Set<string>();
            if (result.rawOrders) result.rawOrders.forEach((o: any) => {
                const d = o.created_at || o.date_created || o.purchaseDate || o.date_created_gmt || new Date().toISOString();
                impacted.add(d.split('T')[0]);
            });
            if (result.adsMetrics) result.adsMetrics.forEach((m: any) => impacted.add(m.date));
            if (result.trafficMetrics) result.trafficMetrics.forEach((m: any) => impacted.add(typeof m.date === 'string' ? m.date : new Date(m.date).toISOString().split('T')[0]));

            // Recalculate Finance
            if (!options.skipRecalc) {
                if (importedCount === 0 && !options.fullSync) {
                    await updateProgress('recalc', 100, 'Aucun changement, recalcul ignoré.');
                } else if (impacted.size > 0) {
                    await updateProgress('recalc', 80, 'Mise à jour des indicateurs...');
                    const dates = Array.from(impacted);
                    const startRecalc = Date.now();
                    for (let j = 0; j < dates.length; j++) {
                        if (Date.now() - startRecalc > 60000) break;
                        if (j % 5 === 0) await updateProgress('recalc', 80 + Math.round((j / dates.length) * 15), `Recalcul ${dates[j]}...`);
                        try {
                            await SyncService.recalculateDay(connection.organizationId, connection.provider as any, new Date(dates[j]), settings);
                        } catch (e) { console.error(`Failed to recalc ${dates[j]}`, e); }
                    }
                }
            }

            (result as any).impactedDates = Array.from(impacted);

            // --- PHASE E: FINISH ---
            await updateProgress('done', 100, 'Terminé avec succès.');

            await prisma.syncLog.update({
                where: { id: log.id },
                data: {
                    status: 'success', finishedAt: new Date(), durationMs: Date.now() - now, itemsImported: importedCount,
                    details: JSON.stringify({ stage: 'done', percent: 100, message: 'Succès', timestamp: Date.now() })
                }
            });

            await prisma.connection.update({
                where: { id: connection.id },
                data: {
                    status: 'ACTIVE',
                    lastSyncAt: new Date(),
                    lastSyncStatus: 'success',
                    errorMessage: null,
                    lastCursor: cursor,
                    ...(options.fullSync ? { lastFullSyncAt: new Date() } : { lastQuickSyncAt: new Date() })
                }
            });

            return { success: true, importedCount: importedCount, impactedDates: Array.from(impacted) };

        } catch (e: any) {
            console.error("Sync Error", e);
            await updateProgress('failed', 0, e.message);
            await prisma.syncLog.update({
                where: { id: log.id },
                data: { status: 'failed', finishedAt: new Date(), durationMs: Date.now() - now, details: JSON.stringify({ error: e.message }) }
            });
            await prisma.connection.update({
                where: { id: connection.id },
                data: { status: 'ERROR', lastSyncStatus: 'failed', errorMessage: e.message }
            });
            return { success: false, error: e.message };
        }
    }

    // Helper: Ads Processing
    // Helper: Ads Processing (Campaign Granularity)
    static async processAds(metrics: any[], connection: any) {
        if (!metrics || metrics.length === 0) return;

        // 1. Aggregation for AdsDaily (Campaign Level)
        const campaignMap = new Map<string, any>();
        // 2. Aggregation for FinanceDaily (Channel Level)
        const channelMap = new Map<string, number>();

        // PRE-CLEANUP to avoid duplication (e.g. meta_ads legacy vs facebook granular)
        // Infer date range from metrics
        const distinctDates = Array.from(new Set(metrics.map(m => typeof m.date === 'string' ? m.date : new Date(m.date).toISOString().split('T')[0])));

        if (distinctDates.length > 0 && connection.organizationId) {
            const minDate = distinctDates.sort()[0];
            const maxDate = distinctDates.sort()[distinctDates.length - 1];

            // If Provider is Meta, we wipe related channels to be safe
            // This ensures we don't have 'meta_ads' + 'facebook' for same day
            const channelsToWipe = connection.provider === 'meta_ads' ? ['meta_ads', 'facebook', 'instagram', 'audience_net'] : [connection.provider];

            await prisma.adsDaily.deleteMany({
                where: {
                    organizationId: connection.organizationId,
                    date: { gte: new Date(minDate), lte: new Date(maxDate) },
                    channel: { in: channelsToWipe }
                }
            });

            // Also clean FinanceDaily for these channels to prevent Spend duplication in P&L
            await prisma.financeDaily.deleteMany({
                where: {
                    organizationId: connection.organizationId,
                    date: { gte: new Date(minDate), lte: new Date(maxDate) },
                    channel: { in: channelsToWipe }
                }
            });
        }

        for (const m of metrics) {
            const dateStr = typeof m.date === 'string' ? m.date : new Date(m.date).toISOString().split('T')[0];
            const channel = m.provider || m.channel || 'unknown';
            const campaign = m.campaignName || m.campaign || 'global';

            // Campaign Key
            const campKey = `${dateStr}|${channel}|${campaign}`;
            if (!campaignMap.has(campKey)) {
                campaignMap.set(campKey, {
                    date: new Date(dateStr),
                    channel,
                    campaign,
                    spend: 0, impr: 0, clicks: 0, conv: 0, val: 0
                });
            }
            const cEntry = campaignMap.get(campKey);
            cEntry.spend += (m.spend || 0);
            cEntry.impr += (m.impressions || 0);
            cEntry.clicks += (m.clicks || 0);
            cEntry.conv += (m.conversions || 0);
            cEntry.val += (m.conversionValue || 0);

            // Channel Key (Only Spend needed for Finance)
            const chanKey = `${dateStr}|${channel}`;
            channelMap.set(chanKey, (channelMap.get(chanKey) || 0) + (m.spend || 0));
        }

        // Upsert AdsDaily
        for (const val of campaignMap.values()) {
            await prisma.adsDaily.upsert({
                where: {
                    organizationId_date_channel_campaign: {
                        organizationId: connection.organizationId,
                        date: val.date,
                        channel: val.channel,
                        campaign: val.campaign
                    }
                },
                create: {
                    organizationId: connection.organizationId, date: val.date, channel: val.channel, campaign: val.campaign,
                    spend: val.spend, impressions: val.impr, clicks: val.clicks, conversions: val.conv, conversionValue: val.val,
                    roas: val.spend > 0 ? val.val / val.spend : 0, cpa: val.conv > 0 ? val.spend / val.conv : 0
                },
                update: {
                    spend: val.spend, impressions: val.impr, clicks: val.clicks, conversions: val.conv, conversionValue: val.val,
                    roas: val.spend > 0 ? val.val / val.spend : 0, cpa: val.conv > 0 ? val.spend / val.conv : 0
                }
            });
        }

        // Upsert FinanceDaily (Ad Spend Only)
        // We use the aggregated total per channel/date to overwrite/set the daily spend.
        for (const [key, totalSpend] of channelMap) {
            const [dateStr, channel] = key.split('|');
            const date = new Date(dateStr);

            await prisma.financeDaily.upsert({
                where: { organizationId_date_channel: { organizationId: connection.organizationId, date: date, channel: channel } },
                create: {
                    organizationId: connection.organizationId, date: date, channel: channel,
                    revenueGross: 0, revenueNet: 0, ordersCount: 0, refundsValue: 0, shippingCost: 0,
                    adSpendTotal: totalSpend
                },
                update: {
                    adSpendTotal: totalSpend
                }
            });
        }
    }

    // Helper: Traffic Processing (Optimized & Stop-Aware)
    static async processTraffic(metrics: any[], connection: any, updateStatus: (msg: string) => void, jobId?: string) {
        if (!metrics || metrics.length === 0) return;

        // Batch Upsert
        const chunks = [];
        const BATCH_SIZE = 50;
        for (let i = 0; i < metrics.length; i += BATCH_SIZE) chunks.push(metrics.slice(i, i + BATCH_SIZE));

        let processed = 0;
        for (const chunk of chunks) {
            await Promise.all(chunk.map(async (m: any) => {
                const date = new Date(m.date);
                await prisma.trafficDaily.upsert({
                    where: {
                        organizationId_date_source_medium: {
                            organizationId: connection.organizationId,
                            date: date,
                            source: m.source,
                            medium: m.medium
                        }
                    },
                    update: { sessions: m.sessions, users: m.users, engagementRate: m.engagementRate },
                    create: {
                        organizationId: connection.organizationId,
                        date: date,
                        source: m.source, medium: m.medium,
                        sessions: m.sessions, users: m.users, engagementRate: m.engagementRate
                    }
                });
            }));
            processed += chunk.length;
            if (updateStatus) updateStatus(`Analytics ${processed}/${metrics.length}`);
        }
    }

    static async processGranularMeta(payload: any, connection: any) {
        const { campaigns, insights, metaAccountId } = payload;

        // 1. Upsert Campaigns
        if (campaigns && campaigns.length > 0) {
            for (const c of campaigns) {
                await prisma.metaCampaign.upsert({
                    where: { id: c.id },
                    update: { name: c.name, status: c.status, objective: c.objective, buyingType: c.buying_type },
                    create: {
                        id: c.id,
                        name: c.name,
                        orgId: connection.organizationId,
                        accountId: metaAccountId || connection.metadata?.account_id || 'unknown',
                        status: c.status,
                        objective: c.objective,
                        buyingType: c.buying_type
                    }
                });
            }
        }

        // 2. Upsert Insights (Batched)
        if (insights && insights.length > 0) {
            const chunks = [];
            const BATCH = 50;
            for (let i = 0; i < insights.length; i += BATCH) chunks.push(insights.slice(i, i + BATCH));

            for (const chunk of chunks) {
                await Promise.all(chunk.map((i: any) =>
                    prisma.metaInsight.upsert({
                        where: {
                            campaignId_date_breakdownType_publisherPlatform_devicePlatform: {
                                campaignId: i.campaignId,
                                date: new Date(i.date),
                                breakdownType: i.breakdownType,
                                publisherPlatform: i.publisherPlatform || 'global',
                                devicePlatform: i.devicePlatform || 'global'
                            }
                        },
                        update: {
                            spend: i.spend, impressions: i.impressions, clicks: i.clicks,
                            ctr: i.ctr, cpc: i.cpc, cpm: i.cpm,
                            actionsJson: i.actionsJson, actionValuesJson: i.actionValuesJson,
                            purchases: i.purchases, purchaseValue: i.purchaseValue
                        },
                        create: {
                            orgId: connection.organizationId,
                            date: new Date(i.date),
                            campaignId: i.campaignId,
                            breakdownType: i.breakdownType,
                            publisherPlatform: i.publisherPlatform || 'global',
                            devicePlatform: i.devicePlatform || 'global',
                            spend: i.spend, impressions: i.impressions, clicks: i.clicks,
                            ctr: i.ctr, cpc: i.cpc, cpm: i.cpm,
                            actionsJson: i.actionsJson, actionValuesJson: i.actionValuesJson,
                            purchases: i.purchases, purchaseValue: i.purchaseValue
                        }
                    })
                ));
            }
        }
    }

    static async processOrder(raw: any, connection: any) {
        try {
            const externalId = raw.id ? String(raw.id) : raw.amazonOrderId;
            const createdAt = new Date(raw.created_at || raw.purchaseDate || raw.date_created_gmt || raw.date_created || new Date());
            const status = raw.status || raw.orderStatus || 'unknown';
            const currency = raw.currency || 'EUR';

            let gross = parseFloat(raw.total_price || raw.orderTotal?.amount || raw.total || '0');
            let totalTax = parseFloat(raw.total_tax || '0');
            let totalDiscount = parseFloat(raw.total_discounts || raw.discount_total || '0');
            let shippingTotal = 0;
            if (raw.shipping_total) {
                shippingTotal = parseFloat(raw.shipping_total);
            } else if (raw.shipping_lines && Array.isArray(raw.shipping_lines)) {
                shippingTotal = raw.shipping_lines.reduce((acc: number, l: any) => acc + parseFloat(l.price || '0'), 0);
            }

            let refundTotal = 0;
            if (raw.refunds) {
                raw.refunds.forEach((r: any) => {
                    r.transactions?.forEach((t: any) => refundTotal += parseFloat(t.amount || '0'));
                });
            }

            const net = gross - totalDiscount - refundTotal;

            const dbOrder = await prisma.order.upsert({
                where: { provider_externalId_orgId: { orgId: connection.organizationId, provider: connection.provider as any, externalId: externalId } },
                create: {
                    orgId: connection.organizationId, provider: connection.provider as any, externalId,
                    orderNumber: raw.order_number ? String(raw.order_number) : externalId, status, currency, createdAtSource: createdAt,
                    grossRevenue: gross, taxRevenue: totalTax, discounts: totalDiscount, shippingRevenue: shippingTotal, refunds: refundTotal, netRevenue: net,
                    sourceConnectionId: connection.id,
                    metadata: {
                        source_raw: raw.meta_data?.find((m: any) => m.key === '_wc_order_attribution_utm_source' || m.key === '_wc_order_attribution_referrer' || m.key === '_billing_wooccm_source' || m.key === 'utm_source' || m.key === 'source')?.value || (raw.referrer ? new URL(raw.referrer).hostname : null) || 'Direct',
                        medium_raw: raw.meta_data?.find((m: any) => m.key === '_wc_order_attribution_utm_medium' || m.key === '_wc_order_attribution_source_type' || m.key === '_billing_wooccm_medium' || m.key === 'utm_medium' || m.key === 'medium')?.value || 'none'
                    }
                },
                update: {
                    status, grossRevenue: gross, taxRevenue: totalTax, discounts: totalDiscount, refunds: refundTotal, netRevenue: net,
                    metadata: {
                        source_raw: raw.meta_data?.find((m: any) => m.key === '_wc_order_attribution_utm_source' || m.key === '_wc_order_attribution_referrer' || m.key === '_billing_wooccm_source' || m.key === 'utm_source' || m.key === 'source')?.value || (raw.referrer ? new URL(raw.referrer).hostname : null) || 'Direct',
                        medium_raw: raw.meta_data?.find((m: any) => m.key === '_wc_order_attribution_utm_medium' || m.key === '_wc_order_attribution_source_type' || m.key === '_billing_wooccm_medium' || m.key === 'utm_medium' || m.key === 'medium')?.value || 'none'
                    }
                }
            });

            // Items (Simplified for restore)
            const items = raw.line_items || raw.items || [];
            if (Array.isArray(items)) {
                for (const item of items) {
                    const lineId = item.id ? String(item.id) : item.OrderItemId;
                    const sku = item.sku || item.SellerSKU || `WOO-MISSING-${item.product_id || item.id}`;
                    const name = item.name || item.Title;
                    const qty = parseFloat(item.quantity || item.QuantityOrdered || '0');
                    const price = parseFloat(item.total || item.ItemPrice?.Amount || '0');

                    const existing = await prisma.orderItem.findFirst({ where: { orderId: dbOrder.id, externalLineId: lineId } });
                    if (existing) {
                        await prisma.orderItem.update({ where: { id: existing.id }, data: { quantity: qty, lineRevenue: price, sku, name } });
                    } else {
                        await prisma.orderItem.create({
                            data: {
                                orderId: dbOrder.id, orgId: connection.organizationId, provider: connection.provider as any,
                                externalLineId: lineId, name, sku, quantity: qty, lineRevenue: price, unitPrice: qty > 0 ? price / qty : 0,
                                asin: item.asin || item.ASIN || undefined
                            }
                        });
                    }

                    if (sku) {
                        const title = name || raw.title || sku;
                        const imageUrl = item.image?.src || item.imageUrl || item.Image?.URL || undefined;
                        const asin = item.asin || item.ASIN || undefined;

                        await prisma.product.upsert({
                            where: { orgId_sku: { orgId: connection.organizationId, sku: String(sku) } },
                            create: {
                                orgId: connection.organizationId, providerPrimary: connection.provider as any,
                                sku: String(sku), title, status: 'ACTIVE', sourceConnectionId: connection.id,
                                externalId: item.product_id ? String(item.product_id) : undefined,
                                imageUrl, asin
                            },
                            update: { title, imageUrl: imageUrl || undefined, asin: asin || undefined }
                        });
                    }
                }
            }
        } catch (e) { console.error(`Error processing order ${raw.id}:`, e); }
    }

    static async processProduct(rawP: any, connection: any) {
        try {
            const sku = rawP.sku || (rawP.id ? `WOO-MISSING-${rawP.id}` : null);
            if (!sku) return;
            let title = rawP.name || rawP.title || sku;
            if (rawP.parent_title && title && !title.includes(rawP.parent_title)) {
                title = `${rawP.parent_title} - ${title}`;
            }
            const imageUrl = rawP.imageUrl || rawP.Image || rawP.SmallImage?.URL || rawP.image?.src || rawP.images?.[0]?.src || null;
            const asin = rawP.asin || rawP.ASIN || null;

            await prisma.product.upsert({
                where: { orgId_sku: { orgId: connection.organizationId, sku: String(sku) } },
                create: {
                    orgId: connection.organizationId, providerPrimary: connection.provider as any,
                    sku: String(sku), title, status: 'ACTIVE', sourceConnectionId: connection.id,
                    imageUrl, asin
                },
                update: { title, imageUrl: imageUrl || undefined, asin: asin || undefined }
            });
        } catch (e) { console.error("Product Process Error", e); }
    }

    // Helper: Recalculate Day (Orders -> Finance/Traffic)
    static async recalculateDay(orgId: string, provider: any, date: Date, settings: any) {
        try {
            const start = new Date(date); start.setHours(0, 0, 0, 0);
            const end = new Date(date); end.setHours(23, 59, 59, 999);

            const orders = await prisma.order.findMany({
                where: { orgId, provider, createdAtSource: { gte: start, lte: end } },
                include: { items: true }
            });

            if (orders.length === 0) return;

            let revenue = 0; let net = 0; let refunds = 0; let shipping = 0;
            for (const o of orders) {
                revenue += o.grossRevenue; net += o.netRevenue; refunds += o.refunds; shipping += o.shippingRevenue;
            }

            // Upsert FinanceDaily (Sales Source)
            await prisma.financeDaily.upsert({
                where: { organizationId_date_channel: { organizationId: orgId, date: start, channel: provider.toLowerCase() } },
                create: { organizationId: orgId, date: start, channel: provider.toLowerCase(), revenueGross: revenue, revenueNet: net, ordersCount: orders.length, refundsValue: refunds, shippingCost: shipping },
                update: { revenueGross: revenue, revenueNet: net, ordersCount: orders.length, refundsValue: refunds, shippingCost: shipping }
            });

            // Product Performance Aggregation (ProductDaily)
            const productMap = new Map<string, { sku: string, name: string, revenue: number, units: number }>();

            for (const o of orders) {
                if (!o.items) continue;
                for (const item of o.items) {
                    // SKU fallback to Name or 'Unknown'
                    const safeSku = item.sku || (item.name ? item.name.substring(0, 30) : `NOSKU-${item.id.substring(0, 8)}`);
                    const key = safeSku;

                    if (!productMap.has(key)) {
                        productMap.set(key, {
                            sku: safeSku,
                            name: item.name || 'Unknown',
                            revenue: 0,
                            units: 0
                        });
                    }
                    const node = productMap.get(key)!;
                    // Use lineRevenue (which is usually price * qty - discount)
                    // If lineRevenue is missing, careful. But OrderItem model has it.
                    node.revenue += item.lineRevenue || 0;
                    node.units += item.quantity || 0;
                }
            }

            // Upsert ProductDaily
            if (productMap.size > 0) {
                // Fetch relevant Costs
                const pertinentSkus = Array.from(productMap.values()).map(v => v.sku);
                const costs = await prisma.product.findMany({
                    where: { orgId: orgId, sku: { in: pertinentSkus } },
                    select: { sku: true, costUnit: true }
                });
                const costMap = new Map<string, number>();
                costs.forEach(c => { if (c.costUnit && c.sku) costMap.set(c.sku, c.costUnit); });

                await Promise.all(Array.from(productMap.values()).map(val => {
                    const unitCost = costMap.get(val.sku) || 0;
                    const cogs = val.units * unitCost;
                    const estimatedProfit = val.revenue - cogs; // Simplified, fees handled elsewhere usually or here? 
                    // Note: Fees usually global. Here we just deduct COGS for Product Profit view.

                    return prisma.productDaily.upsert({
                        where: { organizationId_date_sku: { organizationId: orgId, date: start, sku: val.sku } },
                        create: {
                            organizationId: orgId, date: start, sku: val.sku, name: val.name,
                            revenue: val.revenue, unitsSold: val.units,
                            profitEstimated: estimatedProfit,
                            marginEstimated: val.revenue > 0 ? (estimatedProfit / val.revenue) * 100 : 0
                        },
                        update: {
                            revenue: val.revenue, unitsSold: val.units,
                            profitEstimated: estimatedProfit, // Auto-update with latest revenue but KEEP old cost if not changed? No, use current cost.
                            marginEstimated: val.revenue > 0 ? (estimatedProfit / val.revenue) * 100 : 0
                        }
                    })
                }));
            }

            // Recalc TrafficDaily Revenue/Conversions from Orders
            // Note: This complements the GA4 sync which sets sessions/users
            const trafficMap = new Map<string, { source: string, medium: string, revenue: number, orders: number }>();
            for (const o of orders) {
                const meta = o.metadata as any;
                let src = meta?.source_raw || 'Direct';
                let med = meta?.medium_raw || 'none';
                if (!src) src = 'Direct';
                const key = `${src}|${med}`;
                if (!trafficMap.has(key)) trafficMap.set(key, { source: src, medium: med, revenue: 0, orders: 0 });
                const node = trafficMap.get(key)!;
                node.revenue += o.netRevenue;
                node.orders += 1;
            }

            await Promise.all(Array.from(trafficMap.entries()).map(([key, val]) =>
                prisma.trafficDaily.upsert({
                    where: { organizationId_date_source_medium: { organizationId: orgId, date: start, source: val.source, medium: val.medium } },
                    create: { organizationId: orgId, date: start, source: val.source, medium: val.medium, revenue: val.revenue, conversions: val.orders, sessions: 0 },
                    update: { revenue: val.revenue, conversions: val.orders }
                })
            ));

        } catch (e) { console.error("Recalc Day Error", e); }
    }

    static async processJob(jobId: string) {
        // (Simplified for restoration - keeping core logic)
        const job = await prisma.syncJob.findUnique({ where: { id: jobId } });
        if (!job) return;
        try {
            await prisma.syncJob.update({ where: { id: jobId }, data: { status: 'running', startedAt: new Date() } });
            // Parse Type for Targeted Sync (e.g. "full:connId")
            const [baseType, targetConnId] = job.type.split(':');
            const isFull = baseType === 'full';

            let connections = await prisma.connection.findMany({ where: { organizationId: job.orgId, status: { not: 'DISABLED' } }, include: { organization: { include: { settings: true } } } });

            // Filter for Single Connection if requested
            if (targetConnId) {
                connections = connections.filter(c => c.id === targetConnId);
            }

            if (connections.length === 0) {
                await prisma.syncJob.update({ where: { id: jobId }, data: { status: 'success', progress: 100, message: 'Aucune connexion active trouvée.', finishedAt: new Date() } });
                return;
            }

            let completed = 0;
            const globalImpactedDates = new Set<string>();
            let errors: string[] = [];

            for (const conn of connections) {
                await prisma.syncJob.update({ where: { id: jobId }, data: { message: `Sync ${conn.provider}...`, stage: 'fetching' } });
                try {
                    const res = await SyncService.syncConnection(conn.id, conn, { fullSync: isFull, jobId, skipRecalc: true });
                    if ((res as any).impactedDates) (res as any).impactedDates.forEach((d: any) => globalImpactedDates.add(d));

                    if (!res.success) errors.push(`${conn.provider}: ${res.error}`);
                } catch (e: any) { errors.push(`${conn.provider}: ${e.message}`); }
                completed++;
                await prisma.syncJob.update({ where: { id: jobId }, data: { progress: Math.min(Math.round((completed / connections.length) * 80), 85) } });
            }

            if (globalImpactedDates.size > 0) {
                await prisma.syncJob.update({ where: { id: jobId }, data: { message: `Calcul Global...`, progress: 90 } });
                // Batched Recalc
                const dates = Array.from(globalImpactedDates);
                const settings = connections[0]?.organization?.settings;
                await Promise.all(dates.map(d => Promise.all(connections.map(c => SyncService.recalculateDay(c.organizationId, c.provider as any, new Date(d), settings).catch(e => console.error(e))))));
            }

            await prisma.syncJob.update({ where: { id: jobId }, data: { status: errors.length === connections.length ? 'error' : 'success', progress: 100, message: errors.length > 0 ? `Terminé avec erreurs: ${errors.join(', ')}` : 'Succès', finishedAt: new Date() } });
        } catch (e: any) {
            console.error("Job Failed", e);
            await prisma.syncJob.update({ where: { id: jobId }, data: { status: 'error', error: e.message, finishedAt: new Date() } });
        }
    }
}
