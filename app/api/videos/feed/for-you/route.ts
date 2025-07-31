/**
 * @swagger
 * /videos/feed/for-you:
 *   get:
 *     summary: Get personalized video feed
 *     description: >
 *       Retrieves a personalized feed of videos based on user interests and interactions.
 *       Uses an algorithm that considers watch history, likes, and user preferences.
 *     tags:
 *       - Video Feed
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
 *         description: Personalized video feed
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
const forYouQuerySchema = z.object({
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
        const queryResult = forYouQuerySchema.safeParse(
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

        // Get authenticated user (optional but affects personalization)
        const authUser = await getAuthUser(request);

        // Base query - public videos
        let feedQuery: any = {
            isPublic: true,
        };

        let userInterests: string[] = [];
        let recentlyWatchedIds: string[] = [];
        let likedVideoIds: string[] = [];
        let followedCreatorIds: string[] = [];

        // Enhanced personalization if user is authenticated
        if (authUser) {
            // Get user interests
            const user = await prisma.user.findUnique({
                where: { id: authUser.userId },
                include: {
                    interests: {
                        select: { name: true },
                    },
                },
            });

            if (user) {
                userInterests = user.interests.map((interest) => interest.name);
            }

            // Get recently watched videos (last 100) to avoid repeats
            const recentlyWatched = await prisma.viewHistory.findMany({
                where: {
                    userId: authUser.userId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 100,
                select: {
                    videoId: true,
                },
            });

            recentlyWatchedIds = recentlyWatched.map((item) => item.videoId);

            // Get videos the user liked
            const likedVideos = await prisma.like.findMany({
                where: {
                    userId: authUser.userId,
                },
                select: {
                    videoId: true,
                },
            });

            likedVideoIds = likedVideos.map((like) => like.videoId);

            // Get creators the user follows
            const followings = await prisma.follow.findMany({
                where: {
                    followerId: authUser.userId,
                },
                select: {
                    followingId: true,
                },
            });

            followedCreatorIds = followings.map((follow) => follow.followingId);

            // Modify the base query to include private videos from followed creators
            if (followedCreatorIds.length > 0) {
                feedQuery = {
                    OR: [
                        { isPublic: true },
                        {
                            isPublic: false,
                            userId: {
                                in: followedCreatorIds,
                            },
                        },
                    ],
                };
            }
        }

        // Cursor-based pagination
        if (cursor) {
            feedQuery.id = {
                lt: cursor,
            };
        }

        // Get a pool of candidate videos
        // We'll fetch more than needed, then apply personalization
        const poolSize = limit * 3;

        // Fetch the candidate pool of videos
        const videoPool = await prisma.video.findMany({
            where: feedQuery,
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
            take: poolSize,
        });

        // Transform videos and add personalization scores
        const scoredVideos = videoPool.map((video) => {
            // Start with base score
            let score = 0;

            // Recently watched penalty (to avoid showing the same videos)
            if (recentlyWatchedIds.includes(video.id)) {
                score -= 50; // Strong penalty for recently watched
            }

            // Liked content bonus
            if (likedVideoIds.includes(video.id)) {
                score += 5; // Small bonus for previously liked content
            }

            // Followed creator bonus
            if (followedCreatorIds.includes(video.userId)) {
                score += 20; // Strong bonus for followed creators
            }

            // Engagement bonus (popularity)
            const engagementScore =
                (video._count.likes * 2) +
                (video._count.comments * 3) +
                (video._count.shares * 4) +
                (video._count.views);

            score += Math.min(30, engagementScore / 100); // Cap at 30 points

            // Recency bonus
            const ageInHours =
                (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60);
            const recencyScore = Math.max(0, 20 - (ageInHours / 24)); // Newer content gets up to 20 points

            score += recencyScore;

            // Format the video with counts and score
            return {
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
                personalizationScore: score
            };
        });

        // Sort by personalization score
        scoredVideos.sort((a, b) => b.personalizationScore - a.personalizationScore);

        // Introduce randomness to avoid the feed being too predictable
        // Fisher-Yates shuffle algorithm but only for the top 50% of videos
        const topHalf = Math.ceil(scoredVideos.length / 2);
        for (let i = 0; i < topHalf; i++) {
            const j = Math.floor(Math.random() * topHalf);
            [scoredVideos[i], scoredVideos[j]] = [scoredVideos[j], scoredVideos[i]];
        }

        // Take the requested number
        const selectedVideos = scoredVideos.slice(0, limit);

        // Remove the personalization score from the response
        const finalVideos = selectedVideos.map(({ personalizationScore, ...video }) => video);

        // Get the next cursor
        const nextCursor =
            selectedVideos.length > 0 ? selectedVideos[selectedVideos.length - 1].id : null;

        console.log('For You feed generated:',
            `Returning ${finalVideos.length} videos with next cursor: ${nextCursor}`
        );

        return NextResponse.json(
            {
                success: true,
                videos: finalVideos,
                pagination: {
                    nextCursor,
                    limit
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('For You feed error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}