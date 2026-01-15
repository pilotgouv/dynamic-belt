
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    const email = 'vicariofpro@gmail.com';
    const password = 'password123';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { email },
            data: { passwordHash: hashedPassword }
        });

        return NextResponse.json({ success: true, message: `Password for ${email} reset to ${password}` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
