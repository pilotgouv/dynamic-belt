
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { provider, credentials } = await req.json();

        let success = false;
        let message = '';

        if (provider === 'SHOPIFY') {
            const { ShopifyConnector } = await import('@/lib/connectors/shopify');
            const connector = new ShopifyConnector(credentials.accessToken, credentials.shopDomain);
            success = await connector.validateToken();
            message = success ? 'Connexion Shopify vérifiée.' : 'Échec authentification Shopify.';
        } else {
            // Mock others for now
            success = true;
            message = `Connexion ${provider} simulée OK.`;
        }

        if (success) {
            return NextResponse.json({
                success: true,
                message
            });
        } else {
            return NextResponse.json({
                success: false,
                error: message || "Identifiants invalides."
            }, { status: 400 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
