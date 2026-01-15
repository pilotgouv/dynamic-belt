import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const count = await prisma.user.count();
        // Also check one finance row date
        const firstFinance = await prisma.financeDaily.findFirst({ orderBy: { date: 'asc' } });
        return NextResponse.json({
            status: 'ok',
            userCount: count,
            dbUrlCheck: process.env.DATABASE_URL ? 'Present' : 'Missing',
            oldestFinanceDate: firstFinance?.date || 'None'
        });
    } catch (e: any) {
        return NextResponse.json({ status: 'error', message: e.message, code: e.code }, { status: 500 });
    }
}
