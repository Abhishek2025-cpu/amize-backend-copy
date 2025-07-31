/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search for users, videos, and sounds
 *     description: >
 *       Performs a comprehensive search across users, videos, and sounds.
 *       Supports filtering by type and sorting options.
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, users, videos, sounds]
 *           default: all
 *         description: Type of content to search
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, recent, popular]
 *           default: relevance
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schema for search parameters
const searchQuerySchema = z.object({
    q: z.string().min(1, "Search query is required").max(100, "Search query too long"),
    type: z.enum(['all', 'users', 'videos', 'sounds']).default('all'),
    limit: z.preprocess(
        (val) => (val ? parseInt(val as string) : 20),
        z.number().int().positive().max(50).default(20)
    ),
    offset: z.preprocess(
        (val) => (val ? parseInt(val as string) : 0),
        z.number().int().min(0).default(0)
    ),
    sort: z.enum(['relevance', 'recent', 'popular']).default('relevance'),
});

export async function GET(request: Request) {
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const queryResult = searchQuerySchema.safeParse(
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

        const { q, type, limit, offset, sort } = queryResult.data;

        // Get authenticated user (optional for personalization)
        const authUser = await getAuthUser(request);

        // Prepare search term for full-text search
        const searchTerm = q.trim();
        const searchWords = searchTerm.split(' ').filter(word => word.length > 0);

        // Define properly typed results object
        type UserResult = Awaited<ReturnType<typeof searchUsers>>[number];
        type VideoResult = Awaited<ReturnType<typeof searchVideos>>[number];
        type SoundResult = Awaited<ReturnType<typeof searchSounds>>[number];

        let results: {
            users: UserResult[];
            videos: VideoResult[];
            sounds: SoundResult[];
            total: number;
        } = {
            users: [],
            videos: [],
            sounds: [],
            total: 0
        };

        // Search Users
        if (type === 'all' || type === 'users') {
            const userSearchResults = await searchUsers(searchTerm, searchWords, limit, offset, sort);
            results.users = userSearchResults;
        }

        // Search Videos
        if (type === 'all' || type === 'videos') {
            const videoSearchResults = await searchVideos(searchTerm, searchWords, limit, offset, sort, authUser);
            results.videos = videoSearchResults;
        }

        // Search Sounds
        if (type === 'all' || type === 'sounds') {
            const soundSearchResults = await searchSounds(searchTerm, searchWords, limit, offset, sort);
            results.sounds = soundSearchResults;
        }

        // Calculate total results
        results.total = results.users.length + results.videos.length + results.sounds.length;

        // Log search for analytics (optional)
        if (authUser) {
            // Could log search history here
            console.log(`User ${authUser.userId} searched for: "${searchTerm}"`);
        }

        return NextResponse.json(
            {
                success: true,
                query: searchTerm,
                type,
                results,
                pagination: {
                    limit,
                    offset,
                    total: results.total
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Search Users function
async function searchUsers(searchTerm: string, searchWords: string[], limit: number, offset: number, sort: string) {
    const whereCondition = {
        AND: [
            {
                deactivatedAt: null, // Only active users
            },
            {
                OR: [
                    {
                        username: {
                            contains: searchTerm,
                        },
                    },
                    {
                        fullName: {
                            contains: searchTerm,
                        },
                    },
                    {
                        bio: {
                            contains: searchTerm,
                        },
                    },
                    // Search by individual words
                    ...searchWords.map(word => ({
                        OR: [
                            {
                                username: {
                                    contains: word,
                                },
                            },
                            {
                                fullName: {
                                    contains: word,
                                },
                            },
                        ],
                    })),
                ],
            },
        ],
    };

    let orderBy: any = [{ createdAt: 'desc' }];

    if (sort === 'popular') {
        // Sort by follower count (we'll need to add this as a computed field)
        orderBy = [
            {
                followers: {
                    _count: 'desc',
                },
            },
            { createdAt: 'desc' },
        ];
    }

    const users = await prisma.user.findMany({
        where: whereCondition,
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
        },
        orderBy,
        take: limit,
        skip: offset,
    });

    return users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        bio: user.bio,
        profilePhotoUrl: user.profilePhotoUrl,
        verified: user.creatorVerified,
        category: user.creatorCategory,
        followersCount: user._count.followers,
        videosCount: user._count.videos,
        type: 'user' as const,
    }));
}

// Search Videos function
async function searchVideos(searchTerm: string, searchWords: string[], limit: number, offset: number, sort: string, authUser: any) {
    const whereCondition = {
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
            {
                OR: [
                    {
                        title: {
                            contains: searchTerm,
                        },
                    },
                    {
                        description: {
                            contains: searchTerm,
                        },
                    },
                    {
                        user: {
                            username: {
                                contains: searchTerm,
                            },
                        },
                    },
                    // Search by individual words
                    ...searchWords.map(word => ({
                        OR: [
                            {
                                title: {
                                    contains: word,
                                },
                            },
                            {
                                description: {
                                    contains: word,
                                },
                            },
                        ],
                    })),
                ],
            },
        ],
    };

    let orderBy: any = [{ createdAt: 'desc' }];

    if (sort === 'popular') {
        orderBy = [
            {
                likes: {
                    _count: 'desc',
                },
            },
            {
                views: {
                    _count: 'desc',
                },
            },
            { createdAt: 'desc' },
        ];
    }

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
        orderBy,
        take: limit,
        skip: offset,
    });

    return videos.map(video => ({
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

// Search Sounds function
async function searchSounds(searchTerm: string, searchWords: string[], limit: number, offset: number, sort: string) {
    const whereCondition = {
        OR: [
            {
                title: {
                    contains: searchTerm,
                },
            },
            {
                artistName: {
                    contains: searchTerm,
                },
            },
            // Search by individual words
            ...searchWords.map(word => ({
                OR: [
                    {
                        title: {
                            contains: word,
                        },
                    },
                    {
                        artistName: {
                            contains: word,
                        },
                    },
                ],
            })),
        ],
    };

    let orderBy: any = [{ createdAt: 'desc' }];

    if (sort === 'popular') {
        orderBy = [
            {
                videos: {
                    _count: 'desc',
                },
            },
            { createdAt: 'desc' },
        ];
    }

    const sounds = await prisma.sound.findMany({
        where: whereCondition,
        include: {
            _count: {
                select: {
                    videos: true,
                },
            },
        },
        orderBy,
        take: limit,
        skip: offset,
    });

    return sounds.map(sound => ({
        id: sound.id,
        title: sound.title,
        artistName: sound.artistName,
        soundUrl: sound.soundUrl,
        duration: sound.duration,
        isOriginal: sound.isOriginal,
        videosCount: sound._count.videos,
        createdAt: sound.createdAt,
        type: 'sound' as const,
    }));
}