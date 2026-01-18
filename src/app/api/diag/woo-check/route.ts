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

        // AUTH STRATEGY: Query Params (Safe Mode) - MATCHES CONNECTOR
        const url = new URL(`${storeUrl}/wp-json/wc/v3/orders`);
        url.searchParams.set("consumer_key", consumerKey);
        url.searchParams.set("consumer_secret", consumerSecret);
        url.searchParams.set("per_page", "1"); // We just need headers for count

        console.log("Probing Woo (QueryParam Auth):", url.toString().replace(consumerSecret, '***'));

        const res = await fetch(url.toString(), {
            // No custom headers
        });

        // Capture Headers
        const totalOrders = res.headers.get('x-wp-total');
        const totalPages = res.headers.get('x-wp-totalpages');

        const data = await res.json();

        return NextResponse.json({
            status: res.status,
            auth_method: "query_params",
            headers: {
                "x-wp-total": totalOrders,
                "x-wp-totalpages": totalPages,
                "server": res.headers.get('server')
            },
            first_order_sample: Array.isArray(data) && data.length > 0 ? {
                id: data[0].id,
                date: data[0].date_created,
                status: data[0].status,
                referrer: data[0].referrer || 'null',
                meta_data_keys: data[0].meta_data?.map((m: any) => m.key),
                // Return keys that look like source/attribution
                attribution_candidates: data[0].meta_data?.filter((m: any) =>
                    m.key.includes('source') ||
                    m.key.includes('utm') ||
                    m.key.includes('attribution') ||
                    m.key.includes('referer') ||
                    m.key.includes('wooccm')
                ),
                full_meta_dump: data[0].meta_data
            } : 'No orders returned',
            raw_count: Array.isArray(data) ? data.length : 0,
            api_response_preview: Array.isArray(data) ? "Valid Array" : data
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
