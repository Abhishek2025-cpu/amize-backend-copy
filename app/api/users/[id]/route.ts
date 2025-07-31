// app/api/users/[id]/route.ts

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

        // Get the user profile
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                fullName: true,
                bio: true,
                profilePhotoUrl: true,
                creatorVerified: true,
                creatorCategory: true,
                role: true,
                isEligibleForCreator: true,
                _count: {
                    select: {
                        videos: true,
                        following: true,
                        followers: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Check if the authenticated user follows this user
        let isFollowing = false;
        if (authUser) {
            const followRecord = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: authUser.userId,
                        followingId: id,
                    },
                },
            });
            isFollowing = !!followRecord;
        }

        // Check if viewing own profile
        const isOwnProfile = authUser?.userId === id;

        return NextResponse.json({
            success: true,
            user,
            isOwnProfile,
            isFollowing,
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}