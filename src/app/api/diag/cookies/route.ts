import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { auth } from '@/auth';

export const runtime = 'nodejs'; // Ensure we can see full node headers if needed

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const headersList = await headers();

    let session = null;
    try {
        session = await auth();
    } catch (e) {
        console.error("Auth check failed in diag", e);
    }

    const allCookies = cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' }));
    const allHeaders: Record<string, string> = {};
    headersList.forEach((val, key) => {
        allHeaders[key] = val;
    });

    return NextResponse.json({
        status: 'diagnostic',
        timestamp: new Date().toISOString(),
        session_status: session ? 'Active' : 'Null',
        session_user: session?.user?.email || 'None',
        cookies_received: allCookies,
        auth_cookie_present: cookieStore.getAll().some(c => c.name.includes('next-auth.session-token') || c.name.includes('authjs.session-token')),
        env_check: {
            auth_secret_set: !!process.env.AUTH_SECRET,
            nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
            nextauth_url: process.env.NEXTAUTH_URL || 'Not Set',
            vercel_url: process.env.VERCEL_URL || 'Not Set'
        },
        headers: {
            host: allHeaders['host'],
            origin: allHeaders['origin'],
            'x-forwarded-host': allHeaders['x-forwarded-host'],
            'x-forwarded-proto': allHeaders['x-forwarded-proto'],
        }
    }, { status: 200 });
}
