/**
 * @swagger
 * /videos:
 *   post:
 *     summary: Create a new video
 *     description: >
 *       Creates a new video using an existing upload.
 *       The upload must be of type VIDEO and status COMPLETED.
 *     tags:
 *       - Videos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uploadId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Video title
 *               description:
 *                 type: string
 *                 description: Video description
 *               uploadId:
 *                 type: string
 *                 description: ID of the uploaded video file
 *               soundId:
 *                 type: string
 *                 description: Optional ID of the sound used in the video
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the video is public or private
 *     responses:
 *       201:
 *         description: Video created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Video created successfully
 *                 video:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     videoUrl:
 *                       type: string
 *                     thumbnailUrl:
 *                       type: string
 *                     duration:
 *                       type: number
 *                     isPublic:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid request data
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Upload not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Upload not found or not completed
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *
 *   get:
 *     summary: Get list of videos
 *     description: >
 *       Retrieves a paginated list of videos with optional filtering.
 *     tags:
 *       - Videos
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public/private status
 *       - in: query
 *         name: soundId
 *         schema:
 *           type: string
 *         description: Filter by sound ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 videos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       videoUrl:
 *                         type: string
 *                       thumbnailUrl:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           profilePhotoUrl:
 *                             type: string
 *                       likesCount:
 *                         type: integer
 *                       commentsCount:
 *                         type: integer
 *                       viewsCount:
 *                         type: integer
 *                       sharesCount:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */

import { NextResponse } from 'next/server';
import { PrismaClient, UploadType } from '@prisma/client';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schemas
const createVideoSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    uploadId: z.string().uuid({
        message: 'Invalid upload ID format',
    }),
    soundId: z.string().uuid({
        message: 'Invalid sound ID format',
    }).optional(),
    isPublic: z.boolean().default(true),
});

const videoQuerySchema = z.object({
    userId: z.string().uuid().optional(),
    isPublic: z.preprocess(
        (val) => val === 'true' ? true : val === 'false' ? false : undefined,
        z.boolean().optional()
    ),
    soundId: z.string().uuid().optional(),
    page: z.preprocess(
        (val) => (val ? parseInt(val as string) : 1),
        z.number().int().positive().default(1)
    ),
    limit: z.preprocess(
        (val) => (val ? parseInt(val as string) : 20),
        z.number().int().positive().max(100).default(20)
    ),
});

export async function POST(request: Request) {
    try {
        // Check authentication
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate request body
        const validationResult = createVideoSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation error',
                    errors: validationResult.error.errors,
                },
                { status: 400 }
            );
        }

        const { title, description, uploadId, soundId, isPublic } = validationResult.data;

        // Verify the upload exists, belongs to the user, and is a completed video
        const upload = await prisma.upload.findUnique({
            where: {
                id: uploadId,
                userId: authUser.userId,
                uploadType: UploadType.VIDEO,
                status: 'COMPLETED',
            },
        });

        if (!upload) {
            console.log("Upload not found or not completed, or not a video");
            return NextResponse.json(
                {
                    success: false,
                    message: 'Upload not found, not completed, or not a video',
                },
                { status: 404 }
            );
        }

        // If soundId is provided, verify it exists
        if (soundId) {
            const sound = await prisma.sound.findUnique({
                where: { id: soundId },
            });

            if (!sound) {
                return NextResponse.json(
                    { success: false, message: 'Sound not found' },
                    { status: 404 }
                );
            }
        }

        // Create the video record
        const video = await prisma.video.create({
            data: {
                title: title || upload.originalFileName || 'Untitled Video',
                description: description || '',
                videoUrl: upload.fileUrl,
                thumbnailUrl: upload.thumbnailUrl,
                duration: upload.duration || 0,
                isPublic,
                sound: soundId ? { connect: { id: soundId } } : undefined,
                user: { connect: { id: authUser.userId } },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                    },
                },
                sound: {
                    select: {
                        id: true,
                        title: true,
                        artistName: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Video created successfully',
                video,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create video error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        // Get authentication (optional for public videos)
        const authUser = await getAuthUser(request);

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const queryResult = videoQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

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

        const { userId, isPublic, soundId, page, limit } = queryResult.data;

        // Build filter
        const filter: any = {};

        // If userId is provided, filter by that user
        if (userId) {
            filter.userId = userId;
        }

        // Handle public/private videos
        if (isPublic !== undefined) {
            filter.isPublic = isPublic;
        } else {
            // If not explicitly filtering by isPublic:
            // - If authenticated, show public videos + user's own private videos
            // - If not authenticated, show only public videos
            if (authUser) {
                filter.OR = [
                    { isPublic: true },
                    { userId: authUser.userId },
                ];
            } else {
                filter.isPublic = true;
            }
        }

        // Filter by sound if provided
        if (soundId) {
            filter.soundId = soundId;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalItems = await prisma.video.count({
            where: filter,
        });

        // Fetch videos with counts and user info
        const videos = await prisma.video.findMany({
            where: filter,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                    },
                },
                sound: {
                    select: {
                        id: true,
                        title: true,
                        artistName: true,
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
            skip,
            take: limit,
        });

        // Transform the data to include the counts directly
        const transformedVideos = videos.map((video) => ({
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

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / limit);

        return NextResponse.json(
            {
                success: true,
                videos: transformedVideos,
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get videos error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}