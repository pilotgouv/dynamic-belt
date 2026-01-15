
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const allKeys = Object.keys(process.env).sort();

    return NextResponse.json({
        status: 'ok',
        diagnostics: {
            hasAuthSecret: !!process.env.AUTH_SECRET,
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            nodeEnv: process.env.NODE_ENV,
        },
        availableEnvKeys: allKeys // We list KEYS only, not values, for safety
    });
}
