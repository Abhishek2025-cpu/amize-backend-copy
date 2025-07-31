/**
 * @swagger
 * /explore/feed:
 *   get:
 *     summary: Get mixed explore feed
 *     description: >
 *       Retrieves a mixed feed of videos, users, and sounds in a single stream
 *       with aspect ratio assignments for masonry grid layout
 *     tags:
 *       - Explore
 *     parameters:
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
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for filtered results
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, videos, users, sounds]
 *           default: all
 *         description: Filter by content type
 *     responses:
 *       200:
 *         description: Mixed feed retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schema
const feedQuerySchema = z.object({
    limit: z.preprocess(
        (val) => (val ? parseInt(val as string) : 20),
        z.number().int().positive().max(50).default(20)
    ),
    offset: z.preprocess(
        (val) => (val ? parseInt(val as string) : 0),
        z.number().int().min(0).default(0)
    ),
    query: z.string().optional(),
    type: z.enum(['all', 'videos', 'users', 'sounds']).default('all'),
});

export interface MixedFeedItem {
    id: string;
    type: 'video' | 'user' | 'sound';
    aspectRatio: '1:1' | '1:2' | '2:3' | '9:16' | '2:1';
    priority: number;
    data: any;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const queryResult = feedQuerySchema.safeParse(
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

        const { limit, offset, query, type } = queryResult.data;
        const authUser = await getAuthUser(request);

        let mixedFeed: MixedFeedItem[];

        if (query && query.length >= 2) {
            // Search mode
            mixedFeed = await getSearchFeed(query, type, limit, offset, authUser);
        } else {
            // Default explore feed
            mixedFeed = await getExploreFeed(type, limit, offset, authUser);
        }

        return NextResponse.json(
            {
                success: true,
                feed: mixedFeed,
                pagination: {
                    limit,
                    offset,
                    hasMore: mixedFeed.length === limit
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Mixed feed error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function getExploreFeed(
    type: string,
    limit: number,
    offset: number,
    authUser: any
): Promise<MixedFeedItem[]> {
    const items: MixedFeedItem[] = [];

    // Content distribution ratios
    const videoRatio = type === 'all' ? 0.65 : type === 'videos' ? 1 : 0;
    const userRatio = type === 'all' ? 0.25 : type === 'users' ? 1 : 0;
    const soundRatio = type === 'all' ? 0.10 : type === 'sounds' ? 1 : 0;

    const videoLimit = Math.ceil(limit * videoRatio);
    const userLimit = Math.ceil(limit * userRatio);
    const soundLimit = Math.ceil(limit * soundRatio);

    // Fetch videos
    if (videoLimit > 0) {
        const videos = await getTrendingVideos(videoLimit, offset, authUser);
        videos.forEach((video, index) => {
            items.push({
                id: `video-${video.id}`,
                type: 'video',
                aspectRatio: getVideoAspectRatio(video, index),
                priority: calculatePriority('video', video, index),
                data: video
            });
        });
    }

    // Fetch users
    if (userLimit > 0) {
        const users = await getPopularCreators(userLimit, Math.floor(offset * userRatio), authUser);
        users.forEach((user, index) => {
            items.push({
                id: `user-${user.id}`,
                type: 'user',
                aspectRatio: getUserAspectRatio(user, index),
                priority: calculatePriority('user', user, index),
                data: user
            });
        });
    }

    // Fetch sounds
    if (soundLimit > 0) {
        const sounds = await getTrendingSounds(soundLimit, Math.floor(offset * soundRatio));
        sounds.forEach((sound, index) => {
            items.push({
                id: `sound-${sound.id}`,
                type: 'sound',
                aspectRatio: getSoundAspectRatio(sound, index),
                priority: calculatePriority('sound', sound, index),
                data: sound
            });
        });
    }

    // Mix and sort items for optimal grid layout
    console.log("Items before mixing:", items);
    return mixContentForGrid(items).slice(0, limit);
}

async function getSearchFeed(
    query: string,
    type: string,
    limit: number,
    offset: number,
    authUser: any
): Promise<MixedFeedItem[]> {
    const items: MixedFeedItem[] = [];
    const searchTerm = query.trim();
    const searchWords = searchTerm.split(' ').filter(word => word.length > 0);

    // Search videos
    if (type === 'all' || type === 'videos') {
        const videos = await searchVideos(searchTerm, searchWords, limit, offset, authUser);
        videos.forEach((video, index) => {
            items.push({
                id: `video-${video.id}`,
                type: 'video',
                aspectRatio: getVideoAspectRatio(video, index),
                priority: calculateSearchPriority('video', video, query),
                data: video
            });
        });
    }

    // Search users
    if (type === 'all' || type === 'users') {
        const users = await searchUsers(searchTerm, searchWords, limit, offset);
        users.forEach((user, index) => {
            items.push({
                id: `user-${user.id}`,
                type: 'user',
                aspectRatio: getUserAspectRatio(user, index),
                priority: calculateSearchPriority('user', user, query),
                data: user
            });
        });
    }

    // Search sounds
    if (type === 'all' || type === 'sounds') {
        const sounds = await searchSounds(searchTerm, searchWords, limit, offset);
        sounds.forEach((sound, index) => {
            items.push({
                id: `sound-${sound.id}`,
                type: 'sound',
                aspectRatio: getSoundAspectRatio(sound, index),
                priority: calculateSearchPriority('sound', sound, query),
                data: sound
            });
        });
    }

    return items.sort((a, b) => b.priority - a.priority).slice(0, limit);
}

// Aspect ratio assignment functions
function getVideoAspectRatio(video: any, index: number): '1:1' | '1:2' | '2:3' | '9:16' {
    const engagement = video.likesCount + video.viewsCount + video.commentsCount;

    // High engagement videos get prominent placement
    if (engagement > 50000 || video.trendingScore > 1000) {
        return index % 3 === 0 ? '1:2' : '9:16';
    }

    // Regular rotation for normal content
    const ratios: Array<'1:1' | '2:3' | '9:16'> = ['1:1', '2:3', '9:16'];
    return ratios[index % ratios.length];
}

function getUserAspectRatio(user: any, index: number): '1:1' | '1:2' {
    // Featured creators get tall cards
    if (user.verified || user.followersCount > 100000) {
        return index % 4 === 0 ? '1:2' : '1:1';
    }
    return '1:1';
}

function getSoundAspectRatio(sound: any, index: number): '2:1' | '1:1' {
    // Popular sounds get wide cards for better visualization
    return sound.videosCount > 1000 ? '2:1' : '1:1';
}

// Priority calculation for grid mixing
function calculatePriority(type: string, item: any, index: number): number {
    let basePriority = 0;

    switch (type) {
        case 'video':
            basePriority = item.trendingScore || (item.likesCount + item.viewsCount) / 100;
            break;
        case 'user':
            basePriority = item.followersCount / 1000 + (item.verified ? 500 : 0);
            break;
        case 'sound':
            basePriority = item.videosCount + (item.recentEngagement || 0) / 100;
            break;
    }

    // Add randomness to avoid predictable patterns
    return basePriority + Math.random() * 100 - index * 0.1;
}

function calculateSearchPriority(type: string, item: any, query: string): number {
    let relevanceScore = 0;
    const queryLower = query.toLowerCase();

    switch (type) {
        case 'video':
            if (item.title?.toLowerCase().includes(queryLower)) relevanceScore += 100;
            if (item.user.username.toLowerCase().includes(queryLower)) relevanceScore += 50;
            relevanceScore += (item.likesCount + item.viewsCount) / 1000;
            break;
        case 'user':
            if (item.username.toLowerCase().includes(queryLower)) relevanceScore += 100;
            if (item.fullName?.toLowerCase().includes(queryLower)) relevanceScore += 80;
            relevanceScore += item.followersCount / 1000;
            break;
        case 'sound':
            if (item.title.toLowerCase().includes(queryLower)) relevanceScore += 100;
            if (item.artistName?.toLowerCase().includes(queryLower)) relevanceScore += 50;
            relevanceScore += item.videosCount;
            break;
    }

    return relevanceScore;
}

// Content mixing algorithm for optimal grid layout
function mixContentForGrid(items: MixedFeedItem[]): MixedFeedItem[] {
    const mixed: MixedFeedItem[] = [];
    const videos = items.filter(item => item.type === 'video');
    const users = items.filter(item => item.type === 'user');
    const sounds = items.filter(item => item.type === 'sound');

    let vIndex = 0, uIndex = 0, sIndex = 0;

    // Mix content to avoid clustering same types
    for (let i = 0; i < items.length; i++) {
        if (i % 5 === 0 && uIndex < users.length) {
            // Every 5th item is a user
            mixed.push(users[uIndex++]);
        } else if (i % 8 === 0 && sIndex < sounds.length) {
            // Every 8th item is a sound
            mixed.push(sounds[sIndex++]);
        } else if (vIndex < videos.length) {
            // Fill with videos
            mixed.push(videos[vIndex++]);
        } else if (uIndex < users.length) {
            mixed.push(users[uIndex++]);
        } else if (sIndex < sounds.length) {
            mixed.push(sounds[sIndex++]);
        }
    }

    return mixed;
}

// Helper functions for fetching content (reuse from existing endpoints)
async function getTrendingVideos(limit: number, offset: number, authUser: any) {
    const dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last week

    const videos = await prisma.video.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { isPublic: true },
                        ...(authUser ? [{
                            AND: [
                                { isPublic: false },
                                {
                                    user: {
                                        followers: {
                                            some: { followerId: authUser.userId }
                                        }
                                    }
                                }
                            ]
                        }] : [])
                    ]
                },
                { createdAt: { gte: dateFilter } }
            ]
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    profilePhotoUrl: true,
                    creatorVerified: true,
                }
            },
            sound: {
                select: {
                    id: true,
                    title: true,
                    artistName: true,
                    soundUrl: true,
                    duration: true,
                }
            },
            _count: {
                select: {
                    likes: true,
                    comments: true,
                    views: true,
                    shares: true,
                }
            }
        },
        take: limit * 2,
    });

    return videos.map(video => {
        const ageInHours = (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60);
        const engagement = video._count.likes * 2 + video._count.comments * 3 + video._count.shares * 4 + video._count.views;
        const trendingScore = engagement / Math.max(1, Math.pow(ageInHours + 1, 0.8));

        return {
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
            trendingScore,
        };
    }).sort((a, b) => b.trendingScore - a.trendingScore).slice(0, limit);
}

async function getPopularCreators(limit: number, offset: number, authUser: any) {
    const dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const creators = await prisma.user.findMany({
        where: {
            AND: [
                { deactivatedAt: null },
                { role: { in: ['CREATOR', 'ADMIN'] } },
                {
                    videos: {
                        some: {
                            createdAt: { gte: dateFilter },
                            isPublic: true,
                        }
                    }
                }
            ]
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
                }
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
                        }
                    }
                },
                take: 10,
            }
        },
        orderBy: {
            followers: { _count: 'desc' }
        },
        take: limit,
        skip: offset,
    });

    return creators.map(creator => {
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
        };
    });
}

async function getTrendingSounds(limit: number, offset: number) {
    const dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const sounds = await prisma.sound.findMany({
        where: {
            videos: {
                some: {
                    createdAt: { gte: dateFilter },
                    isPublic: true,
                }
            }
        },
        include: {
            _count: {
                select: { videos: true }
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
                        }
                    }
                },
                take: 10,
            }
        },
        orderBy: {
            videos: { _count: 'desc' }
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
        };
    });
}

async function searchVideos(searchTerm: string, searchWords: string[], limit: number, offset: number, authUser: any) {
    const whereCondition = {
        AND: [
            {
                OR: [
                    { isPublic: true },
                    ...(authUser ? [{
                        AND: [
                            { isPublic: false },
                            {
                                user: {
                                    followers: {
                                        some: { followerId: authUser.userId }
                                    }
                                }
                            }
                        ]
                    }] : [])
                ]
            },
            {
                OR: [
                    { title: { contains: searchTerm } },
                    { description: { contains: searchTerm } },
                    { user: { username: { contains: searchTerm } } },
                    ...searchWords.map(word => ({
                        OR: [
                            { title: { contains: word } },
                            { description: { contains: word } }
                        ]
                    }))
                ]
            }
        ]
    };

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
                }
            },
            sound: {
                select: {
                    id: true,
                    title: true,
                    artistName: true,
                    soundUrl: true,
                    duration: true,
                }
            },
            _count: {
                select: {
                    likes: true,
                    comments: true,
                    views: true,
                    shares: true,
                }
            }
        },
        orderBy: [
            { likes: { _count: 'desc' } },
            { views: { _count: 'desc' } },
            { createdAt: 'desc' }
        ],
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
    }));
}

async function searchUsers(searchTerm: string, searchWords: string[], limit: number, offset: number) {
    const whereCondition = {
        AND: [
            { deactivatedAt: null },
            {
                OR: [
                    { username: { contains: searchTerm } },
                    { fullName: { contains: searchTerm } },
                    { bio: { contains: searchTerm } },
                    ...searchWords.map(word => ({
                        OR: [
                            { username: { contains: word } },
                            { fullName: { contains: word } }
                        ]
                    }))
                ]
            }
        ]
    };

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
                }
            }
        },
        orderBy: {
            followers: { _count: 'desc' }
        },
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
    }));
}

async function searchSounds(searchTerm: string, searchWords: string[], limit: number, offset: number) {
    const whereCondition = {
        OR: [
            { title: { contains: searchTerm } },
            { artistName: { contains: searchTerm } },
            ...searchWords.map(word => ({
                OR: [
                    { title: { contains: word } },
                    { artistName: { contains: word } }
                ]
            }))
        ]
    };

    const sounds = await prisma.sound.findMany({
        where: whereCondition,
        include: {
            _count: {
                select: { videos: true }
            }
        },
        orderBy: {
            videos: { _count: 'desc' }
        },
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
    }));
}