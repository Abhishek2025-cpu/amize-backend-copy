/**
 * @swagger
 * /videos/feed/following:
 *   get:
 *     summary: Get videos from followed creators
 *     description: >
 *       Retrieves videos from creators that the user follows.
 *     tags:
 *       - Video Feed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of videos to return
 *     responses:
 *       200:
 *         description: Videos from followed creators
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for query parameters
const followingQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.preprocess(
        (val) => (val ? parseInt(val as string) : 10),
        z.number().int().positive().max(20).default(10)
    ),
});

export async function GET(request: Request) {
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const queryResult = followingQuerySchema.safeParse(
            Object.fromEntries(searchParams.entries())
        );

        if (!queryResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid query parameters',
                    errors: queryResult.error.errors,
                },
                { status: 400 }
            );
        }

        const { cursor, limit } = queryResult.data;

        // Authentication is required for this endpoint
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get creators the user follows
        const followings = await prisma.follow.findMany({
            where: {
                followerId: authUser.userId,
            },
            select: {
                followingId: true,
            },
        });

        const followedCreatorIds = followings.map((follow) => follow.followingId);

        // Check if the user follows any creators
        if (followedCreatorIds.length === 0) {
            return NextResponse.json(
                {
                    success: true,
                    videos: [],
                    message: "You're not following any creators yet",
                    pagination: {
                        nextCursor: null,
                        limit,
                    },
                },
                { status: 200 }
            );
        }

        // Build query
        let followingFeedQuery: any = {
            userId: {
                in: followedCreatorIds,
            },
        };

        // Add cursor for pagination
        if (cursor) {
            followingFeedQuery.id = {
                lt: cursor,
            };
        }

        // Get recently watched videos to avoid showing them again
        const recentlyWatched = await prisma.viewHistory.findMany({
            where: {
                userId: authUser.userId,
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
            },
            select: {
                videoId: true,
            },
        });

        const recentlyWatchedIds = recentlyWatched.map((item) => item.videoId);

        // Exclude recently watched if we have any
        if (recentlyWatchedIds.length > 0) {
            followingFeedQuery.id = {
                ...followingFeedQuery.id,
                notIn: recentlyWatchedIds,
            };
        }

        // Fetch videos from followed creators
        const videos = await prisma.video.findMany({
            where: followingFeedQuery,
            orderBy: [
                {
                    createdAt: 'desc',
                },
            ],
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                        fullName: true,
                        bio: true,
                        creatorVerified: true,
                    },
                },
                sound: {
                    select: {
                        id: true,
                        title: true,
                        artistName: true,
                        soundUrl: true,
                        duration: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        views: true,
                        shares: true,
                    },
                },
            },
            take: limit + 1, // +1 to determine if there's a next page
        });

        // Check if we have more results
        const hasMore = videos.length > limit;
        const paginatedVideos = hasMore ? videos.slice(0, limit) : videos;

        // Transform videos for response
        const transformedVideos = paginatedVideos.map((video) => ({
            id: video.id,
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            isPublic: video.isPublic,
            user: video.user,
            sound: video.sound,
            likesCount: video._count.likes,
            commentsCount: video._count.comments,
            viewsCount: video._count.views,
            sharesCount: video._count.shares,
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
        }));

        // Get the next cursor for pagination
        const nextCursor =
            hasMore && paginatedVideos.length > 0
                ? paginatedVideos[paginatedVideos.length - 1].id
                : null;

        return NextResponse.json(
            {
                success: true,
                videos: transformedVideos,
                pagination: {
                    nextCursor,
                    limit,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Following feed error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}