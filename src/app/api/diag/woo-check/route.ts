import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

import { ConnectionService } from '@/lib/connections/connection-service';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const orgId = (session.user as any).organizationId;
        const connection = await prisma.connection.findFirst({
            where: { organizationId: orgId, provider: 'WOOCOMMERCE' }
        });

        if (!connection) {
            return NextResponse.json({ error: 'No WooCommerce connection found' });
        }

        const credentials = ConnectionService.getDecryptedCredentials(connection);
        const consumerKey = credentials.consumerKey || credentials.apiKey;
        const consumerSecret = credentials.consumerSecret || credentials.apiSecret;
        const storeUrl = credentials.shopUrl || credentials.storeUrl;

        // Construct Auth Header manually to match Connector logic
        const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const headers = {
            "Authorization": `Basic ${authString}`,
            "Content-Type": "application/json"
        };

        // Probe URL: per_page=1 to get headers quickly
        const url = `${storeUrl}/wp-json/wc/v3/orders?per_page=1`;

        console.log("Probing Woo:", url);

        const res = await fetch(url, { headers });

        // Capture Headers
        const totalOrders = res.headers.get('x-wp-total');
        const totalPages = res.headers.get('x-wp-totalpages');

        const data = await res.json();

        return NextResponse.json({
            status: res.status,
            headers: {
                "x-wp-total": totalOrders,
                "x-wp-totalpages": totalPages
            },
            first_order_sample: Array.isArray(data) && data.length > 0 ? {
                id: data[0].id,
                date: data[0].date_created,
                status: data[0].status
            } : 'No orders returned',
            raw_count: Array.isArray(data) ? data.length : 0
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
