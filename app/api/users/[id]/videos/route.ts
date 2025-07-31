// app/api/users/[id]/videos/route.ts

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

interface Params {
    params: {
        id: string;
    };
}

export async function GET(request: Request, { params }: Params) {
    try {
        const { id } = params;
        const authUser = await getAuthUser(request);
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // If user is viewing their own profile, show all videos
        // Otherwise only show public videos or follow-only if they're following
        let whereClause: any = { userId: id };

        if (authUser?.userId !== id) {
            // Not viewing own profile
            whereClause.isPublic = true;
        }

        const skip = (page - 1) * limit;

        // Get videos
        const videos = await prisma.video.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                        creatorVerified: true,
                    },
                },
                sound: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        views: true,
                    },
                },
            },
            skip,
            take: limit,
        });

        // Get total count
        const total = await prisma.video.count({
            where: whereClause,
        });

        return NextResponse.json({
            success: true,
            videos,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        });
    } catch (error) {
        console.error('Error fetching user videos:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}