import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const searchSchema = z.object({
    q: z.string().min(1),
    limit: z.preprocess(
        (val) => (val ? parseInt(val as string) : 20),
        z.number().int().positive().max(50).default(20)
    ),
});

export async function GET(request: Request) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const queryResult = searchSchema.safeParse(Object.fromEntries(searchParams.entries()));

        if (!queryResult.success) {
            return NextResponse.json(
                { success: false, message: 'Invalid query parameters' },
                { status: 400 }
            );
        }

        const { q, limit } = queryResult.data;

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        username: {
                            contains: q,
                        },
                    },
                    {
                        fullName: {
                            contains: q,
                        },
                    },
                ],
                NOT: {
                    id: authUser.userId,
                },
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                profilePhotoUrl: true,
                creatorVerified: true,
                isOnline: true,
            },
            take: limit,
            orderBy: [
                { creatorVerified: 'desc' },
                { username: 'asc' },
            ],
        });

        return NextResponse.json({
            success: true,
            users,
        });

    } catch (error) {
        console.error('Search users error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}