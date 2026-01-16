
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = (session.user as any).organizationId;

    const body = await req.json();
    const { date } = body; // Target date (or "today")

    // Define comparison windows (e.g., Last 7 Days vs Previous 7 Days)
    const end = date ? new Date(date) : new Date();
    const start = new Date(end); start.setDate(start.getDate() - 7);

    const prevEnd = new Date(start);
    const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - 7);

    try {
        // 1. Fetch Metrics (Current vs Previous)
        const [current, previous] = await Promise.all([
            getPeriodMetrics(orgId, start, end),
            getPeriodMetrics(orgId, prevStart, prevEnd)
        ]);

        // 2. Prepare Prompt Data
        const context = {
            currentPeriod: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
            metrics: {
                revenue: { current: current.revenue, previous: previous.revenue, delta: current.revenue - previous.revenue },
                profit: { current: current.profit, previous: previous.profit, delta: current.profit - previous.profit },
                spend: { current: current.spend, previous: previous.spend, delta: current.spend - previous.spend },
                roas: { current: current.roas, previous: previous.roas },
                orders: { current: current.orders, previous: previous.orders }
            }
        };

        // 3. Call LLM
        const apiKey = process.env.OPENAI_API_KEY;
        let insight = "";

        if (!apiKey) {
            insight = "Mode Simulation (Clé API manquante) : La marge a varié de " + context.metrics.profit.delta.toFixed(0) + "€. " +
                (context.metrics.profit.delta < 0 ? "Cette baisse semble liée à " : "Cette hausse est due à ") +
                (context.metrics.spend.delta > 0 ? "une augmentation des dépenses pub." : "une variation organique.");
        } else {
            insight = await callOpenAI(apiKey, context);
        }

        return NextResponse.json({ insight, context });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function getPeriodMetrics(orgId: string, start: Date, end: Date) {
    const finances = await prisma.financeDaily.groupBy({
        by: ['organizationId'],
        where: { organizationId: orgId, date: { gte: start, lte: end } },
        _sum: { revenueNet: true, profitEstimated: true, ordersCount: true, cogs: true }
    });

    const ads = await prisma.adsDaily.groupBy({
        by: ['organizationId'],
        where: { organizationId: orgId, date: { gte: start, lte: end } },
        _sum: { spend: true, conversionValue: true } // conversionValue IS revenue
    });

    const f = finances[0]?._sum || {};
    const a = ads[0]?._sum || {};

    const profit = f.profitEstimated || 0;
    const revenue = f.revenueNet || 0;
    const spend = a.spend || 0;
    const adsRevenue = a.conversionValue || 0;

    return {
        revenue,
        profit,
        orders: f.ordersCount || 0,
        cogs: f.cogs || 0,
        spend,
        roas: spend > 0 ? adsRevenue / spend : 0
    };
}

async function callOpenAI(apiKey: string, context: any) {
    const prompt = `
    You are an expert E-commerce CFO/Analyst called "Captain".
    Analyze the following performance change between two 7-day periods:
    
    Data:
    - Revenue: ${context.metrics.revenue.current.toFixed(0)}€ (vs ${context.metrics.revenue.previous.toFixed(0)}€)
    - Net Profit: ${context.metrics.profit.current.toFixed(0)}€ (vs ${context.metrics.profit.previous.toFixed(0)}€)
    - Ad Spend: ${context.metrics.spend.current.toFixed(0)}€ (vs ${context.metrics.spend.previous.toFixed(0)}€)
    - ROAS: ${context.metrics.roas.current.toFixed(2)} (vs ${context.metrics.roas.previous.toFixed(2)})
    
    Task:
    Explain WHY the Profit changed. Be concise (max 2 sentences).
    Focus on the driver: Was it Ad Efficiency (ROAS), Volume, or Cost increase?
    Speak in French. Professional but direct tone.
    `;

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // or gpt-3.5-turbo
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150
            })
        });

        const json = await res.json();
        if (json.error) return "Erreur AI: " + json.error.message;
        return json.choices?.[0]?.message?.content || "Pas de réponse.";
    } catch (e) {
        return "Erreur de connexion AI.";
    }
}
