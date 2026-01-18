import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
    },
    trustHost: true,
    cookies: {
        sessionToken: {
            name: `__Secure-authjs.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true,
            }
        }
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            // DEBUG: Allow everything to break the loop
            return true;
        },
        async session({ session, token }: any) {
            if (token) {
                session.user.id = token.sub;
                session.user.role = token.role;
                session.user.plan = token.plan;
                session.user.organizationId = token.organizationId;
            }
            return session;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
                token.plan = (user as any).plan;
                token.organizationId = (user as any).organizationId;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts to avoid Edge issues
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "temp_secret_change_me_in_prod_urgently",
} satisfies NextAuthConfig;
