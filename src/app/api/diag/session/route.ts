import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function GET() {
    let session: any = null;
    let authError = null;

    try {
        session = await auth();
    } catch (e: any) {
        authError = e.message;
    }

    return NextResponse.json({
        status: 'diagnostic',
        timestamp: new Date().toISOString(),
        session_present: !!session,
        session_user: session?.user?.id || null,
        session_email: session?.user?.email || null,
        error: authError,
        ok: true
    });
}
