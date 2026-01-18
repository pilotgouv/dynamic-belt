import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { email: session.user?.email! },
        include: { memberships: { include: { organization: true } } }
    });

    if (!user?.memberships[0]) return NextResponse.json({ error: 'No org' }, { status: 400 });
    const orgId = user.memberships[0].organizationId;

    const url = new URL(req.url);
    const period = url.searchParams.get('period');
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    let startDate = new Date();
    let endDate = new Date();

    if (fromParam && toParam) {
        startDate = new Date(fromParam);
        endDate = new Date(toParam);
    } else {
        const days = period === '7j' ? 7 : period === '90j' ? 90 : period === 'ytd' ? 365 : 30; // Simply mapping ytd to ~365 or actual YTD logic
        if (period === 'ytd') startDate = new Date(new Date().getFullYear(), 0, 1);
        else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1);
        else startDate.setDate(startDate.getDate() - days);
    }

    try {
        // 1. Try fetching TrafficDaily (GA4 / Detailed)
        const trafficData = await prisma.trafficDaily.findMany({
            where: {
                organizationId: orgId,
                date: { gte: startDate, lte: endDate }
            }
        });

        // 2. If no detailed traffic data, fallback to Channel Data (FinanceDaily)
        const financeData = await prisma.financeDaily.findMany({
            where: {
                organizationId: orgId,
                date: { gte: startDate, lte: endDate }
            }
        });

        let payload = [];
        let dailyPayload: any[] = [];
        let isFallback = trafficData.length === 0;

        if (isFallback) {
            // Aggregate FinanceDaily by Channel
            const manualMap = new Map<string, any>();
            // Aggregate Daily for Chart/Table
            const dailyMap = new Map<string, any>();

            financeData.forEach(day => {
                // Sources 
                const source = mapChannelToSource(day.channel);
                if (!manualMap.has(source)) {
                    manualMap.set(source, {
                        source,
                        medium: 'sales_channel',
                        sessions: 0,
                        orders: 0,
                        revenue: 0,
                        profit: 0
                    });
                }
                const node = manualMap.get(source);
                node.orders += day.ordersCount;
                node.revenue += day.revenueNet;
                node.profit += day.profitEstimated;

                // Daily
                const dateKey = day.date.toISOString().split('T')[0];
                if (!dailyMap.has(dateKey)) {
                    dailyMap.set(dateKey, { date: dateKey, revenue: 0, orders: 0, sessions: 0 });
                }
                const dNode = dailyMap.get(dateKey);
                dNode.revenue += day.revenueNet;
                dNode.orders += day.ordersCount;
            });
            payload = Array.from(manualMap.values());
            dailyPayload = Array.from(dailyMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        } else {
            // Aggregate TrafficDaily
            const aggMap = new Map<string, any>();
            const dailyMap = new Map<string, any>();

            trafficData.forEach(day => {
                const key = `${day.source}/${day.medium}`;
                if (!aggMap.has(key)) {
                    aggMap.set(key, {
                        source: day.source,
                        medium: day.medium,
                        sessions: 0,
                        orders: 0,
                        revenue: 0,
                        profit: 0
                    });
                }
                const node = aggMap.get(key);
                node.sessions += day.sessions;
                node.orders += day.conversions;
                node.revenue += day.revenue;

                // Daily
                const dateKey = day.date.toISOString().split('T')[0];
                if (!dailyMap.has(dateKey)) {
                    dailyMap.set(dateKey, { date: dateKey, revenue: 0, orders: 0, sessions: 0 });
                }
                const dNode = dailyMap.get(dateKey);
                dNode.revenue += day.revenue;
                dNode.orders += day.conversions;
                dNode.sessions += day.sessions;
            });
            payload = Array.from(aggMap.values());
            dailyPayload = Array.from(dailyMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        // Totals
        const totalRevenue = payload.reduce((acc, c) => acc + c.revenue, 0);
        const totalOrders = payload.reduce((acc, c) => acc + c.orders, 0);
        const totalSessions = payload.reduce((acc, c) => acc + c.sessions, 0);
        const conversionRate = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;

        return NextResponse.json({
            sources: payload.sort((a, b) => b.revenue - a.revenue),
            daily: dailyPayload,
            summary: {
                revenue: totalRevenue,
                orders: totalOrders,
                sessions: totalSessions,
                conversion_rate: conversionRate
            },
            is_fallback: isFallback
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

function mapChannelToSource(channel: string) {
    if (channel === 'SHOPIFY') return 'Shopify Direct';
    if (channel === 'WOOCOMMERCE') return 'WooCommerce Direct';
    if (channel === 'AMAZON_SELLER') return 'Amazon Marketplace';
    return 'Other';
}
