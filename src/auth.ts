import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" }, // Vital for credentials provider
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: String(credentials.email) },
                    include: { memberships: true } // Fetch role if needed
                });

                if (!user || !user.passwordHash) return null;

                const valid = await bcrypt.compare(String(credentials.password), user.passwordHash);
                if (!valid) return null;

                // Return user profile
                // Find primary role. Logic: First membership or viewer default
                const role = user.memberships[0]?.role || 'viewer';

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: role
                };
            },
        }),
    ],
    pages: {
        signIn: '/login',
        // newUser: '/signup' // Optional
    },
    callbacks: {
        async session({ session, token }: any) {
            if (token) {
                session.user.id = token.sub;
                session.user.role = token.role;
                // Add organizationId to session for convenience if needed later
                // session.user.organizationId = token.organizationId; 
            }
            return session;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        }
    }
});
