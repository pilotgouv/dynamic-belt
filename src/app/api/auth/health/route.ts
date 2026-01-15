
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        env: {
            hasAuthSecret: !!process.env.AUTH_SECRET || !!process.env.NEXTAUTH_SECRET,
            nodeEnv: process.env.NODE_ENV,
            host: process.env.VERCEL_URL || 'localhost'
        }
    });
}
