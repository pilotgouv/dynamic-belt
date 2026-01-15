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
        const consumerKey = credentials.consumerKey;
        const consumerSecret = credentials.consumerSecret;
        const storeUrl = credentials.storeUrl;

        // Build URL for user inspection
        const url = new URL(`${storeUrl}/wp-json/wp/v2/users/me`);
        url.searchParams.set("consumer_key", consumerKey);
        url.searchParams.set("consumer_secret", consumerSecret);
        url.searchParams.set("context", "edit"); // Request details

        console.log("Checking Permissions:", url.toString().replace(consumerSecret, '***'));

        const res = await fetch(url.toString());

        if (res.status === 401 || res.status === 403) {
            return NextResponse.json({
                status: res.status,
                message: "API Key invalid or forbidden.",
                headers: Object.fromEntries(res.headers.entries())
            });
        }

        const data = await res.json();

        // Also check index of orders to see strict count
        const ordersUrl = new URL(`${storeUrl}/wp-json/wc/v3/orders`);
        ordersUrl.searchParams.set("consumer_key", consumerKey);
        ordersUrl.searchParams.set("consumer_secret", consumerSecret);
        ordersUrl.searchParams.set("per_page", "1");

        const resOrders = await fetch(ordersUrl.toString());
        const totalVisible = resOrders.headers.get('x-wp-total');


        return NextResponse.json({
            who_am_i: {
                id: data.id,
                username: data.username,
                name: data.name,
                roles: data.roles,
                capabilities: data.capabilities, // This will list exact perms
                extra_capabilities: data.extra_capabilities
            },
            api_visibility: {
                total_orders_visible_via_api: totalVisible,
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
