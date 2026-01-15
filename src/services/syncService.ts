import { prisma } from "@/lib/prisma";
import { ShopifyConnector } from "@/lib/connectors/shopify";
import { BusinessEngine } from "@/lib/engine";
import { AlertService } from "@/services/alertService";
import { ConnectionService } from "@/lib/connections/connection-service";

export class SyncService {

    static async syncConnection(connectionId: string, connectionEntity?: any) {
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
        if (connection.lastSyncAt && connection.lastSyncStatus === 'success') {
            fromDate = new Date(connection.lastSyncAt);
            // Safety: Go back 1 hour to ensure no overlap/gaps
            fromDate.setHours(fromDate.getHours() - 1);
            console.log(`Starting Incremental Sync from ${fromDate.toISOString()}`);
        } else {
            // Phase 3.1: Full Historical Sync (First run or after error)
            fromDate.setFullYear(2020, 0, 1);
            console.log(`Starting Full Historical Sync from ${fromDate.toISOString()}`);
        }

        const result = await connector.sync(fromDate, toDate);

        // 4. Persist Results & Apply Business Logic
        if (result.success) {
            const settings = connection.organization.settings;

            // A. Finance Metrics (Shopify)
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
                                cogsEsitmatedPercent: settings?.cogsEstimatedPercent || 40
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
                            organizationId_date: {
                                organizationId: connection.organizationId,
                                date: new Date(dayMetric.date)
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
                            dataConfidence: 80
                        }
                    });
                }
            }

            // B. Ads Metrics (Google Ads)
            if (result.adsMetrics && result.adsMetrics.length > 0) {
                for (const adMetric of result.adsMetrics) {
                    if (!adMetric.date) continue;

                    await prisma.adsDaily.upsert({
                        where: {
                            organizationId_date_channel: {
                                organizationId: connection.organizationId,
                                date: new Date(adMetric.date),
                                channel: adMetric.channel
                            }
                        },
                        update: {
                            spend: adMetric.spend,
                            impressions: adMetric.impressions,
                            clicks: adMetric.clicks,
                            conversions: adMetric.conversions,
                            conversionValue: adMetric.conversionValue,
                            roas: adMetric.roas,
                            cpa: adMetric.cpa
                        },
                        create: {
                            organizationId: connection.organizationId,
                            date: new Date(adMetric.date),
                            channel: adMetric.channel,
                            spend: adMetric.spend || 0,
                            impressions: adMetric.impressions || 0,
                            clicks: adMetric.clicks || 0,
                            conversions: adMetric.conversions || 0,
                            conversionValue: adMetric.conversionValue || 0,
                            roas: adMetric.roas || 0,
                            cpa: adMetric.cpa || 0
                        }
                    });
                }
            }

            // C. Traffic Metrics (GA4)
            if (result.trafficMetrics && result.trafficMetrics.length > 0) {
                for (const traffic of result.trafficMetrics) {
                    if (!traffic.date) continue;

                    await prisma.trafficDaily.upsert({
                        where: {
                            organizationId_date_source_medium: {
                                organizationId: connection.organizationId,
                                date: new Date(traffic.date),
                                source: traffic.source,
                                medium: traffic.medium
                            }
                        },
                        update: {
                            sessions: traffic.sessions,
                            users: traffic.users,
                            engagementRate: traffic.engagementRate,
                            conversions: traffic.conversions,
                            revenue: traffic.revenue
                        },
                        create: {
                            organizationId: connection.organizationId,
                            date: new Date(traffic.date),
                            source: traffic.source,
                            medium: traffic.medium,
                            sessions: traffic.sessions || 0,
                            users: traffic.users || 0,
                            engagementRate: traffic.engagementRate || 0,
                            conversions: traffic.conversions || 0,
                            revenue: traffic.revenue || 0
                        }
                    });
                }
            }

            // C2. Upsert Product Metrics
            if (result.productMetrics && result.productMetrics.length > 0) {
                // Batching would be better, but sequential for safety in V2
                for (const p of result.productMetrics) {
                    // Check if date is valid
                    if (!p.date) continue;

                    await prisma.productDaily.upsert({
                        where: {
                            organizationId_date_sku: {
                                organizationId: connection.organizationId,
                                date: new Date(p.date),
                                sku: p.sku || 'UNKNOWN'
                            }
                        },
                        update: {
                            unitsSold: p.unitsSold,
                            revenue: p.revenue,
                            name: p.name || 'Unknown Product',
                            profitEstimated: p.profitEstimated,
                            marginEstimated: p.marginEstimated
                        },
                        create: {
                            organizationId: connection.organizationId,
                            date: new Date(p.date),
                            sku: p.sku || 'UNKNOWN',
                            name: p.name || 'Unknown Product',
                            unitsSold: p.unitsSold,
                            revenue: p.revenue,
                            profitEstimated: p.profitEstimated || 0,
                            marginEstimated: p.marginEstimated || 0
                        }
                    });
                }
            }

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

            await prisma.syncRun.create({
                data: {
                    connectionId: connection.id,
                    status: 'success',
                    itemsImported: result.importedCount,
                    finishedAt: new Date()
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
            await prisma.syncRun.create({
                data: {
                    connectionId: connection.id,
                    status: 'failed',
                    finishedAt: new Date(),
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
