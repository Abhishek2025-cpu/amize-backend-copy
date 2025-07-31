/**
 * @swagger
 * /videos/feed/subscribed:
 *   get:
 *     summary: Get premium content from subscribed creators
 *     description: >
 *       Retrieves premium/subscriber-only content from creators that the user has an active subscription to.
 *     tags:
 *       - Video Feed
 *       - Content Monetization
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
 *         description: Premium videos from subscribed creators
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
const subscribedQuerySchema = z.object({
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
        const queryResult = subscribedQuerySchema.safeParse(
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

        // Get creators the user has active subscriptions to
        const subscriptions = await prisma.userSubscription.findMany({
            where: {
                subscriberId: authUser.userId,
                status: 'active', // Only active subscriptions
                endDate: {
                    gte: new Date(), // Subscription hasn't expired
                },
            },
            select: {
                creatorId: true,
            },
        });

        const subscribedCreatorIds = subscriptions.map((sub) => sub.creatorId);

        // Check if the user has any active subscriptions
        if (subscribedCreatorIds.length === 0) {
            return NextResponse.json(
                {
                    success: true,
                    videos: [],
                    message: "You don't have any active subscriptions. Subscribe to creators to see premium content!",
                    pagination: {
                        nextCursor: null,
                        limit,
                    },
                },
                { status: 200 }
            );
        }

        // Build query to get premium content from subscribed creators
        let subscribedFeedQuery: any = {
            userId: {
                in: subscribedCreatorIds,
            },
            isPublic: false, // Only get premium/private content
        };

        // Add cursor for pagination
        if (cursor) {
            subscribedFeedQuery.id = {
                lt: cursor,
            };
        }

        // Fetch premium videos from subscribed creators
        const videos = await prisma.video.findMany({
            where: subscribedFeedQuery,
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

        // Add subscription info to videos
        const subscribedVideos = await Promise.all(
            paginatedVideos.map(async (video) => {
                // Find the user's subscription for this creator
                const subscription = await prisma.userSubscription.findFirst({
                    where: {
                        subscriberId: authUser.userId,
                        creatorId: video.userId,
                        status: 'active',
                    },
                    include: {
                        plan: {
                            select: {
                                name: true,
                                price: true,
                                currency: true,
                                features: true,
                            },
                        },
                    },
                });

                // Transform the video with extra subscription info
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
                    subscription: subscription
                        ? {
                            planName: subscription.plan.name,
                            subscribedSince: subscription.startDate,
                            expiresAt: subscription.endDate,
                        }
                        : null,
                };
            })
        );

        // Get the next cursor for pagination
        const nextCursor =
            hasMore && paginatedVideos.length > 0
                ? paginatedVideos[paginatedVideos.length - 1].id
                : null;

        return NextResponse.json(
            {
                success: true,
                videos: subscribedVideos,
                pagination: {
                    nextCursor,
                    limit,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Subscribed feed error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}