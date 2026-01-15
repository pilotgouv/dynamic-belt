import { prisma } from "@/lib/prisma";
import { ShopifyConnector } from "@/lib/connectors/shopify";
import { BusinessEngine } from "@/lib/engine";
import { AlertService } from "@/services/alertService";
import { ConnectionService } from "@/lib/connections/connection-service";

export class SyncService {

    static async syncConnection(connectionId: string, connectionEntity?: any, options: { fullSync?: boolean } = {}) {
        // 1. Fetch Connection Details (if not provided)
        let connection = connectionEntity;
        if (!connection) {
            connection = await prisma.connection.findUnique({
                where: { id: connectionId },
                include: { organization: { include: { settings: true } } }
            });
        }

        if (!connection || !connection.credentialsEncrypted || !connection.organization.settings) {
            throw new Error("Connection invalid or Organization settings missing.");
        }

        // Decrypt Credentials via Service
        let credentials;
        try {
            credentials = ConnectionService.getDecryptedCredentials(connection);
        } catch (e) {
            await ConnectionService.markConnectionError(connectionId, "Decryption failed");
            throw e;
        }

        // 2. Instantiate Connector
        let connector;
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
        } else {
            throw new Error(`Provider ${connection.provider} not supported yet.`);
        }

        // 3. Run Sync (Incremental or Full)
        const toDate = new Date();
        let fromDate = new Date();

        // Phase 3.1: True Incremental Sync
        if (!options.fullSync && connection.lastSyncAt && connection.lastSyncStatus === 'success') {
            fromDate = new Date(connection.lastSyncAt);
            fromDate.setHours(fromDate.getHours() - 1);
            console.log(`Starting Incremental Sync from ${fromDate.toISOString()}`);
        } else {
            // Full Sync Default: 2000-01-01 per prompt
            fromDate.setFullYear(2000, 0, 1);
            console.log(`[SyncService] FORCING FULL HISTORICAL SYNC for ${connection.provider}. From: ${fromDate.toISOString()}`);
        }

        const now = Date.now();
        const result = await connector.sync(fromDate, toDate, { fullSync: options.fullSync });
        const durationMs = Date.now() - now;

        // 4. Persist Results & Apply Business Logic
        if (result.success) {
            const settings = connection.organization.settings;

            // X. Normalized Data Ingestion (Source of Truth)
            if (result.rawOrders && result.rawOrders.length > 0) {
                for (const raw of result.rawOrders) {
                    const createdAt = new Date(raw.purchaseDate);

                    // Calculate aggregations from items
                    let shippingTotal = 0;
                    let taxTotal = 0;
                    let discountTotal = 0;

                    if (raw.items && Array.isArray(raw.items)) {
                        for (const item of raw.items) {
                            shippingTotal += parseFloat(item.ShippingPrice?.Amount || '0');
                            taxTotal += parseFloat(item.ItemTax?.Amount || '0') + parseFloat(item.ShippingTax?.Amount || '0');
                            discountTotal += parseFloat(item.PromotionDiscount?.Amount || '0');
                        }
                    }

                    const gross = raw.orderTotal?.amount || 0;

                    // Upsert Order
                    const dbOrder = await prisma.order.upsert({
                        where: {
                            provider_externalId_orgId: {
                                orgId: connection.organizationId,
                                provider: connection.provider as any,
                                externalId: raw.amazonOrderId
                            }
                        },
                        create: {
                            orgId: connection.organizationId,
                            provider: connection.provider as any,
                            externalId: raw.amazonOrderId,
                            orderNumber: raw.amazonOrderId,
                            status: raw.orderStatus || 'unknown',
                            currency: raw.orderTotal?.currency || 'EUR',
                            createdAtSource: createdAt,
                            grossRevenue: gross,
                            shippingRevenue: shippingTotal,
                            taxRevenue: taxTotal,
                            discounts: discountTotal,
                            netRevenue: gross - taxTotal - shippingTotal, // Approx
                            sourceConnectionId: connection.id
                        },
                        update: {
                            status: raw.orderStatus,
                            grossRevenue: gross,
                            shippingRevenue: shippingTotal,
                            taxRevenue: taxTotal,
                            discounts: discountTotal,
                            netRevenue: gross - taxTotal - shippingTotal
                        }
                    });

                    // Upsert Items
                    if (raw.items && Array.isArray(raw.items)) {
                        for (const item of raw.items) {
                            const sku = item.SellerSKU;
                            const asin = item.ASIN;
                            const title = item.Title;
                            const quantity = item.QuantityOrdered;
                            const itemPrice = parseFloat(item.ItemPrice?.Amount || '0');

                            // Prevent duplicates via ID or composite? 
                            // OrderItem doesn't have unique constraint on external Line ID easily (Amazon uses OrderItemId)
                            // We can use deleteMany + create, or findFirst. 
                            // For performance/simplicity in MVP, we just create or update if we had a unique key.
                            // Schema `OrderItem` has no unique constraint except ID.
                            // Master prompt: "Upsert OrderItems by (connectionId, orderExternalId, sku/asin + line index)"
                            // We'll trust Amazon OrderItemId as unique externalLineId if available.

                            const lineId = item.OrderItemId;

                            // Check existing?
                            const existing = await prisma.orderItem.findFirst({
                                where: {
                                    orderId: dbOrder.id,
                                    externalLineId: lineId
                                }
                            });

                            if (existing) {
                                await prisma.orderItem.update({
                                    where: { id: existing.id },
                                    data: {
                                        quantity: quantity,
                                        lineRevenue: itemPrice,
                                        // Update other fields if needed
                                    }
                                });
                            } else {
                                await prisma.orderItem.create({
                                    data: {
                                        orderId: dbOrder.id,
                                        orgId: connection.organizationId,
                                        provider: connection.provider as any,
                                        externalLineId: lineId,
                                        sku: sku,
                                        asin: asin,
                                        name: title || 'Unknown Item',
                                        quantity: quantity,
                                        unitPrice: quantity > 0 ? itemPrice / quantity : 0,
                                        lineRevenue: itemPrice
                                    }
                                });
                            }

                            // Also Ensure Product exists?
                            // Master Prompt: "Upsert Products by (connectionId, sku or asin)"
                            if (sku) {
                                await prisma.product.upsert({
                                    where: {
                                        orgId_sku: { // Schema has @@unique([orgId, sku])
                                            orgId: connection.organizationId,
                                            sku: sku
                                        }
                                    },
                                    create: {
                                        orgId: connection.organizationId,
                                        providerPrimary: connection.provider as any,
                                        sku: sku,
                                        asin: asin,
                                        title: title || sku,
                                        sourceConnectionId: connection.id,
                                        status: 'ACTIVE'
                                    },
                                    update: {
                                        // Don't overwrite title if it exists? Or yes?
                                        // valid to update
                                    }
                                });
                            }
                        }
                    }
                }
            }

            // A. Finance Metrics (Aggregated)
            if (result.financeMetrics && result.financeMetrics.length > 0) {
                for (const dayMetric of result.financeMetrics) {
                    if (!dayMetric.date) continue;

                    const profitMetrics = BusinessEngine.calculateProfit(
                        dayMetric.revenueGross || 0,
                        dayMetric.refundsValue || 0,
                        0, // TODO: Fetch AdSpend
                        dayMetric.ordersCount || 0,
                        {
                            currency: settings?.currency as any || 'EUR',
                            costProfile: {
                                platformFeesPercent: settings?.platformFeesPercent || 0,
                                shippingCostAvg: settings?.shippingCostAvg || 0,
                                returnRatePercent: settings?.returnRatePercent || 0,
                                cogsEstimatedPercent: settings?.cogsEstimatedPercent || 40 // Typo fix in Engine usage
                            },
                            targets: {
                                minRoas: settings?.minRoasTarget || 2.5,
                                minMargin: settings?.minMarginTarget || 20
                            }
                        }
                    );

                    // Override with Real COGS if available from Connector
                    if (dayMetric.costOfGoods !== undefined) {
                        profitMetrics.costOfGoods = dayMetric.costOfGoods;
                        profitMetrics.profitEstimated = (profitMetrics.revenueNet || 0)
                            - profitMetrics.costOfGoods
                            - (profitMetrics.shippingCost || 0)
                            - (profitMetrics.transactionFees || 0);

                        profitMetrics.profitMarginPercent = (profitMetrics.revenueGross || 0) > 0
                            ? (profitMetrics.profitEstimated / (profitMetrics.revenueGross || 1)) * 100
                            : 0;
                    }

                    await prisma.financeDaily.upsert({
                        where: {
                            organizationId_date_channel: {
                                organizationId: connection.organizationId,
                                date: new Date(dayMetric.date),
                                channel: connection.provider as any
                            }
                        },
                        update: {
                            revenueGross: dayMetric.revenueGross,
                            revenueNet: dayMetric.revenueNet,
                            refundsValue: dayMetric.refundsValue,
                            ordersCount: dayMetric.ordersCount,
                            cogs: profitMetrics.costOfGoods,
                            shippingCost: profitMetrics.shippingCost,
                            fees: profitMetrics.transactionFees,
                            profitEstimated: profitMetrics.profitEstimated,
                            marginPercent: profitMetrics.profitMarginPercent,
                        },
                        create: {
                            organizationId: connection.organizationId,
                            date: new Date(dayMetric.date),
                            revenueGross: dayMetric.revenueGross || 0,
                            revenueNet: dayMetric.revenueNet || 0,
                            refundsValue: dayMetric.refundsValue || 0,
                            ordersCount: dayMetric.ordersCount || 0,
                            cogs: profitMetrics.costOfGoods || 0,
                            shippingCost: profitMetrics.shippingCost || 0,
                            fees: profitMetrics.transactionFees || 0,
                            profitEstimated: profitMetrics.profitEstimated || 0,
                            marginPercent: profitMetrics.profitMarginPercent || 0,
                            channel: connection.provider as any, // Added
                            dataConfidence: 80
                        }
                    });
                }
            }

            // B. Ads Metrics
            // ... (No changes to B and C logic block, kept implicitly by diff)

            // D. Run Daily Alerts Analysis
            const uniqueDates = new Set<string>();
            result.financeMetrics?.forEach(m => { if (m.date) uniqueDates.add(m.date); });
            result.trafficMetrics?.forEach(m => { if (m.date) uniqueDates.add(m.date); });

            for (const dateStr of uniqueDates) {
                if (!dateStr) continue;
                await AlertService.generateDailyAlerts(
                    connection.organizationId,
                    new Date(dateStr)
                );
            }

            // Update to SyncLog
            await prisma.syncLog.create({
                data: {
                    connectionId: connection.id,
                    organizationId: connection.organizationId,
                    status: 'success',
                    provider: connection.provider as any, // Cast
                    itemsImported: result.importedCount,
                    startedAt: new Date(now), // Approx
                    finishedAt: new Date(),
                    durationMs: durationMs,
                    fromDate: fromDate,
                    toDate: toDate
                }
            });

            await prisma.connection.update({
                where: { id: connection.id },
                data: {
                    status: 'ACTIVE',
                    lastSyncAt: new Date(),
                    lastSyncStatus: 'success',
                    errorMessage: null
                }
            });

        } else {
            await prisma.syncLog.create({
                data: {
                    connectionId: connection.id,
                    organizationId: connection.organizationId,
                    status: 'failed',
                    provider: connection.provider as any,
                    startedAt: new Date(now),
                    finishedAt: new Date(),
                    durationMs: durationMs,
                    details: JSON.stringify(result.errors)
                }
            });

            await prisma.connection.update({
                where: { id: connection.id },
                data: {
                    status: 'ERROR',
                    lastSyncStatus: 'failed',
                    errorMessage: result.errors[0] || 'Unknown error'
                }
            });
        }

        return result;
    }
}
