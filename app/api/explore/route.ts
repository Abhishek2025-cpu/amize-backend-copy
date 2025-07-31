/**
 * @swagger
 * /explore:
 *   get:
 *     summary: Get explore content
 *     description: >
 *       Retrieves trending content, popular creators, and personalized recommendations
 *       for the explore page. Content is personalized based on user interests if authenticated.
 *     tags:
 *       - Explore
 *     parameters:
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [trending, creators, categories, sounds, recommendations]
 *           default: trending
 *         description: Section of explore content to retrieve
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by specific category
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, all]
 *           default: week
 *         description: Timeframe for trending content
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: Explore content retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schema for explore parameters
const exploreQuerySchema = z.object({
    section: z.enum(['trending', 'creators', 'categories', 'sounds', 'recommendations']).default('trending'),
    category: z.string().optional(),
    timeframe: z.enum(['hour', 'day', 'week', 'month', 'all']).default('week'),
    limit: z.preprocess(
        (val) => (val ? parseInt(val as string) : 20),
        z.number().int().positive().max(50).default(20)
    ),
    offset: z.preprocess(
        (val) => (val ? parseInt(val as string) : 0),
        z.number().int().min(0).default(0)
    ),
});

export async function GET(request: Request) {
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const queryResult = exploreQuerySchema.safeParse(
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

        const { section, category, timeframe, limit, offset } = queryResult.data;

        // Get authenticated user (optional for personalization)
        const authUser = await getAuthUser(request);

        let content = [];

        switch (section) {
            case 'trending':
                content = await getTrendingVideos(timeframe, category, limit, offset, authUser);
                break;
            case 'creators':
                content = await getPopularCreators(timeframe, limit, offset, authUser);
                break;
            case 'categories':
                content = await getCategoryContent(category, limit, offset, authUser);
                break;
            case 'sounds':
                content = await getTrendingSounds(timeframe, limit, offset);
                break;
            case 'recommendations':
                content = await getRecommendations(authUser, limit, offset);
                break;
            default:
                content = await getTrendingVideos(timeframe, category, limit, offset, authUser);
        }

        return NextResponse.json(
            {
                success: true,
                section,
                content,
                pagination: {
                    limit,
                    offset,
                    hasMore: content.length === limit
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Explore error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Get trending videos
async function getTrendingVideos(timeframe: string, category: string | undefined, limit: number, offset: number, authUser: any) {
    // Calculate date filter based on timeframe
    const now = new Date();
    let dateFilter: Date | undefined;

    switch (timeframe) {
        case 'hour':
            dateFilter = new Date(now.getTime() - 60 * 60 * 1000);
            break;
        case 'day':
            dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case 'week':
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            dateFilter = undefined;
    }

    const whereCondition: any = {
        AND: [
            {
                // Show public videos or private videos from followed users
                OR: [
                    { isPublic: true },
                    ...(authUser ? [{
                        AND: [
                            { isPublic: false },
                            {
                                user: {
                                    followers: {
                                        some: {
                                            followerId: authUser.userId,
                                        },
                                    },
                                },
                            },
                        ],
                    }] : []),
                ],
            },
            ...(dateFilter ? [{ createdAt: { gte: dateFilter } }] : []),
            ...(category ? [{
                user: {
                    creatorCategory: {
                        equals: category,
                        mode: 'insensitive' as const,
                    },
                },
            }] : []),
        ],
    };

    // Get videos with engagement metrics for trending calculation
    const videos = await prisma.video.findMany({
        where: whereCondition,
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    profilePhotoUrl: true,
                    creatorVerified: true,
                    creatorCategory: true,
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
        take: limit * 3, // Get more videos to calculate trending score
    });

    // Calculate trending score for each video
    const videosWithScore = videos.map(video => {
        const ageInHours = (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60);
        const engagement = video._count.likes * 2 + video._count.comments * 3 + video._count.shares * 4 + video._count.views;

        // Trending score: higher engagement + recency bonus
        const trendingScore = engagement / Math.max(1, Math.pow(ageInHours + 1, 0.8));

        return {
            ...video,
            trendingScore,
        };
    });

    // Sort by trending score and take requested amount
    const trendingVideos = videosWithScore
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(offset, offset + limit);

    return trendingVideos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        user: video.user,
        sound: video.sound,
        likesCount: video._count.likes,
        commentsCount: video._count.comments,
        viewsCount: video._count.views,
        sharesCount: video._count.shares,
        createdAt: video.createdAt,
        trendingScore: video.trendingScore,
        type: 'video' as const,
    }));
}

// Get popular creators
async function getPopularCreators(timeframe: string, limit: number, offset: number, authUser: any) {
    const now = new Date();
    let dateFilter: Date | undefined;

    switch (timeframe) {
        case 'week':
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const creators = await prisma.user.findMany({
        where: {
            AND: [
                { deactivatedAt: null },
                { role: { in: ['CREATOR', 'ADMIN'] } },
                // Has created content recently
                {
                    videos: {
                        some: {
                            createdAt: { gte: dateFilter },
                            isPublic: true,
                        },
                    },
                },
            ],
        },
        select: {
            id: true,
            username: true,
            fullName: true,
            bio: true,
            profilePhotoUrl: true,
            creatorVerified: true,
            creatorCategory: true,
            _count: {
                select: {
                    followers: true,
                    videos: true,
                },
            },
            videos: {
                where: {
                    createdAt: { gte: dateFilter },
                    isPublic: true,
                },
                select: {
                    _count: {
                        select: {
                            likes: true,
                            views: true,
                        },
                    },
                },
                take: 10, // Recent videos for engagement calculation
            },
        },
        orderBy: [
            {
                followers: {
                    _count: 'desc',
                },
            },
            { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
    });

    return creators.map(creator => {
        // Calculate recent engagement
        const recentEngagement = creator.videos.reduce((total, video) => {
            return total + video._count.likes + video._count.views;
        }, 0);

        return {
            id: creator.id,
            username: creator.username,
            fullName: creator.fullName,
            bio: creator.bio,
            profilePhotoUrl: creator.profilePhotoUrl,
            verified: creator.creatorVerified,
            category: creator.creatorCategory,
            followersCount: creator._count.followers,
            videosCount: creator._count.videos,
            recentEngagement,
            type: 'creator' as const,
        };
    });
}

// Get category-based content
async function getCategoryContent(category: string | undefined, limit: number, offset: number, authUser: any) {
    if (!category) {
        // Return available categories
        const categories = await prisma.user.findMany({
            where: {
                creatorCategory: { not: null },
                deactivatedAt: null,
                role: { in: ['CREATOR', 'ADMIN'] },
            },
            select: {
                creatorCategory: true,
                _count: {
                    select: {
                        videos: true,
                    },
                },
            },
            distinct: ['creatorCategory'],
        });

        const categoryStats = categories.reduce((acc: any, user) => {
            const cat = user.creatorCategory;
            if (cat) {
                acc[cat] = (acc[cat] || 0) + user._count.videos;
            }
            return acc;
        }, {});

        return Object.entries(categoryStats)
            .map(([name, videosCount]) => ({
                name,
                videosCount,
                type: 'category' as const,
            }))
            .sort((a, b) => (b.videosCount as number) - (a.videosCount as number))
            .slice(offset, offset + limit);
    }

    // Return videos from specific category
    return getTrendingVideos('week', category, limit, offset, authUser);
}

// Get trending sounds
async function getTrendingSounds(timeframe: string, limit: number, offset: number) {
    const now = new Date();
    let dateFilter: Date | undefined;

    switch (timeframe) {
        case 'week':
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const sounds = await prisma.sound.findMany({
        where: {
            videos: {
                some: {
                    createdAt: { gte: dateFilter },
                    isPublic: true,
                },
            },
        },
        include: {
            _count: {
                select: {
                    videos: true,
                },
            },
            videos: {
                where: {
                    createdAt: { gte: dateFilter },
                    isPublic: true,
                },
                select: {
                    _count: {
                        select: {
                            likes: true,
                            views: true,
                        },
                    },
                },
                take: 10,
            },
        },
        orderBy: {
            videos: {
                _count: 'desc',
            },
        },
        take: limit,
        skip: offset,
    });

    return sounds.map(sound => {
        const recentEngagement = sound.videos.reduce((total, video) => {
            return total + video._count.likes + video._count.views;
        }, 0);

        return {
            id: sound.id,
            title: sound.title,
            artistName: sound.artistName,
            soundUrl: sound.soundUrl,
            duration: sound.duration,
            isOriginal: sound.isOriginal,
            videosCount: sound._count.videos,
            recentEngagement,
            createdAt: sound.createdAt,
            type: 'sound' as const,
        };
    });
}

// Get personalized recommendations
async function getRecommendations(authUser: any, limit: number, offset: number) {
    if (!authUser) {
        // For unauthenticated users, return trending content
        return getTrendingVideos('week', undefined, limit, offset, null);
    }

    // Get user's interests and followed creators
    const user = await prisma.user.findUnique({
        where: { id: authUser.userId },
        include: {
            interests: {
                select: { name: true },
            },
            following: {
                select: { followingId: true },
            },
        },
    });

    if (!user) {
        return getTrendingVideos('week', undefined, limit, offset, authUser);
    }

    const userInterests = user.interests.map(interest => interest.name);
    const followedUserIds = user.following.map(follow => follow.followingId);

    // Get videos based on interests and followed users
    const recommendedVideos = await prisma.video.findMany({
        where: {
            AND: [
                { isPublic: true },
                {
                    OR: [
                        // Videos from followed users
                        {
                            userId: { in: followedUserIds },
                        },
                        // Videos from creators in user's interest categories
                        {
                            user: {
                                creatorCategory: { in: userInterests },
                            },
                        },
                        // Popular videos
                        {
                            likes: {
                                _count: { gte: 10 },
                            },
                        },
                    ],
                },
            ],
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    profilePhotoUrl: true,
                    creatorVerified: true,
                    creatorCategory: true,
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
        orderBy: [
            { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
    });

    return recommendedVideos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        user: video.user,
        sound: video.sound,
        likesCount: video._count.likes,
        commentsCount: video._count.comments,
        viewsCount: video._count.views,
        sharesCount: video._count.shares,
        createdAt: video.createdAt,
        type: 'video' as const,
    }));
}