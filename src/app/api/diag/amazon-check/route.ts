
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ConnectionService } from '@/lib/connections/connection-service';
import { AmazonSellerConnector } from '@/lib/connectors/amazon-seller';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
        }

        // Find Amazon Connection
        const connection = await prisma.connection.findFirst({
            where: {
                organizationId: orgId,
                provider: 'AMAZON_SELLER'
            }
        });

        if (!connection) {
            return NextResponse.json({ error: 'No Amazon Seller connection found' }, { status: 404 });
        }

        const credentials = ConnectionService.getDecryptedCredentials(connection);
        const connector = new AmazonSellerConnector(credentials);

        const startTime = Date.now();

        // 1. Check LWA Token Exchange
        let lwaToken = '';
        try {
            lwaToken = await connector.getAccessToken();
        } catch (e: any) {
            return NextResponse.json({
                status: 'error',
                step: 'LWA Token Exchange',
                error: e.message
            }, { status: 500 });
        }

        // 2. Check SP-API Connectivity (Marketplaces)
        let marketplaces = [];
        try {
            const res = await connector.signedRequest('/sellers/v1/marketplaceParticipations');
            if (!res.ok) {
                return NextResponse.json({
                    status: 'error',
                    step: 'SP-API Marketplaces',
                    httpInitialStatus: res.status,
                    body: await res.text()
                }, { status: 502 });
            }
            const data = await res.json();
            marketplaces = data.payload || [];
        } catch (e: any) {
            return NextResponse.json({
                status: 'error',
                step: 'SP-API Call',
                error: e.message
            }, { status: 500 });
        }

        const duration = Date.now() - startTime;

        return NextResponse.json({
            status: 'ok',
            durationMs: duration,
            connectionId: connection.id,
            lwaTokenPreview: lwaToken.substring(0, 10) + '...',
            marketplacesCount: marketplaces.length,
            marketplaces: marketplaces.map((m: any) => m.marketplace.id + ' (' + m.marketplace.countryCode + ')'),
            credentialsUsed: {
                region: credentials.region,
                lwaClientIdPreview: credentials.lwaClientId?.substring(0, 5) + '...'
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
