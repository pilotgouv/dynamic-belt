import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const finance = await prisma.financeDaily.aggregate({
            _min: { date: true },
            _max: { date: true },
            _count: true
        });

        const products = await prisma.productDaily.aggregate({
            _min: { date: true },
            _max: { date: true },
            _count: true
        });

        const ads = await prisma.adsDaily.aggregate({
            _min: { date: true },
            _max: { date: true },
            _count: true
        });

        const traffic = await prisma.trafficDaily.aggregate({
            _min: { date: true },
            _max: { date: true },
            _count: true
        });

        return NextResponse.json({
            finance: { min: finance._min.date, max: finance._max.date, count: finance._count },
            products: { min: products._min.date, max: products._max.date, count: products._count },
            ads: { min: ads._min.date, max: ads._max.date, count: ads._count },
            traffic: { min: traffic._min.date, max: traffic._max.date, count: traffic._count },
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
