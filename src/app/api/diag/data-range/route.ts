import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');
        if (!orgId) return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });

        const [ordersAgg, ordersByProvider, itemsCount] = await Promise.all([
            prisma.order.aggregate({
                _min: { createdAtSource: true },
                _max: { createdAtSource: true },
                _count: true,
                where: { orgId }
            }),
            prisma.order.groupBy({
                by: ['provider'],
                _count: true,
                where: { orgId }
            }),
            prisma.orderItem.count({ where: { orgId } })
        ]);

        return NextResponse.json({
            orders: {
                total: ordersAgg._count,
                oldest: ordersAgg._min.createdAtSource,
                newest: ordersAgg._max.createdAtSource,
                breakdown: ordersByProvider
            },
            items: {
                total: itemsCount
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
