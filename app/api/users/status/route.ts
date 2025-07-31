import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { isOnline } = await request.json();

        const user = await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                isOnline: isOnline ?? true,
                lastSeenAt: new Date(),
            },
            select: {
                id: true,
                username: true,
                isOnline: true,
                lastSeenAt: true,
            }
        });

        return NextResponse.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Update status error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}