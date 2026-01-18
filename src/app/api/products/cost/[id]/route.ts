import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recalculateProductHistory } from "@/services/productService";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    const user = session?.user as any;
    if (!user || (!user.organizationId && !user.orgId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = user.organizationId || user.orgId;
    const productId = params.id;

    try {
        const body = await req.json();
        const { costUnit, costDetails } = body;

        // Validation
        if (typeof costUnit !== 'number' || isNaN(costUnit)) {
            return NextResponse.json({ ok: false, code: "INVALID_INPUT", error: "Invalid cost (must be number)" }, { status: 400 });
        }

        // 1. Fetch Product by ID (Stable)
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ ok: false, code: "PRODUCT_NOT_FOUND", error: "Product not found" }, { status: 404 });
        }

        if (product.orgId !== orgId) {
            return NextResponse.json({ ok: false, code: "FORBIDDEN", error: "Not authorized for this product" }, { status: 403 });
        }

        // 2. Update Product Master Data
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                costUnit: costUnit,
                costDetails: costDetails || undefined
            }
        });

        // 3. Trigger async recalculation for historical data (ProductDaily)
        // We await it here for the user feedback loop to be instant (they want "Vrai Profit" to update everywhere)
        // SKU is reliable if Product exists.
        if (product.sku) {
            await recalculateProductHistory(orgId, product.sku, costUnit);
        }

        // Contract Response
        return NextResponse.json({
            ok: true,
            product: updatedProduct,
            job: { recalc: "done" }
        });

    } catch (e: any) {
        console.error("Error updating COGS:", e);
        return NextResponse.json({ ok: false, code: "SERVER_ERROR", error: e.message }, { status: 500 });
    }
}
