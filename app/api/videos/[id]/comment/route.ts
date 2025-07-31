/**
 * @swagger
 * /videos/{id}/comment:
 *   get:
 *     summary: Get comments for a video
 *     description: >
 *       Retrieves paginated comments for a specific video.
 *       Supports filtering by parent comment for replies.
 *     tags:
 *       - Video Interactions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Parent comment ID to get replies (optional)
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
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       text:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       videoId:
 *                         type: string
 *                       parentId:
 *                         type: string
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
 *                       repliesCount:
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
 *       404:
 *         description: Video not found
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
 *                   example: Video not found
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
 *   post:
 *     summary: Add a comment to a video
 *     description: >
 *       Adds a new comment to a video. Can be a top-level comment
 *       or a reply to another comment.
 *     tags:
 *       - Video Interactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Comment text
 *               parentId:
 *                 type: string
 *                 description: Parent comment ID for replies (optional)
 *     responses:
 *       201:
 *         description: Comment added successfully
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
 *                   example: Comment added successfully
 *                 comment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     text:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     videoId:
 *                       type: string
 *                     parentId:
 *                       type: string
 *                     user:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
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
 *         description: Video or parent comment not found
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
 *                   example: Video or parent comment not found
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
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

interface Params {
    params: Promise<{
        id: string;
    }>;
}

// Validation schema for queries
const commentQuerySchema = z.object({
    parentId: z.string().uuid().optional(),
    page: z.preprocess(
        (val) => (val ? parseInt(val as string) : 1),
        z.number().int().positive().default(1)
    ),
    limit: z.preprocess(
        (val) => (val ? parseInt(val as string) : 20),
        z.number().int().positive().max(100).default(20)
    ),
});

// Validation schema for adding a comment
const addCommentSchema = z.object({
    text: z.string().min(1, 'Comment text is required'),
    parentId: z.string().uuid().optional(),
});

// Get comments for a video
export async function GET(request: Request, props: Params) {
    const params = await props.params;
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);

        // Parse and validate query parameters
        const queryResult = commentQuerySchema.safeParse(
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

        const { parentId, page, limit } = queryResult.data;

        // Check if video exists
        const video = await prisma.video.findUnique({
            where: { id },
        });

        if (!video) {
            return NextResponse.json(
                { success: false, message: 'Video not found' },
                { status: 404 }
            );
        }

        // If parentId is provided, check if the parent comment exists
        if (parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: parentId, videoId: id },
            });

            if (!parentComment) {
                return NextResponse.json(
                    { success: false, message: 'Parent comment not found' },
                    { status: 404 }
                );
            }
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build comment filter
        const filter: any = {
            videoId: id,
        };

        // If parentId is provided, get replies to that comment
        // Otherwise, get top-level comments (where parentId is null)
        if (parentId) {
            filter.parentId = parentId;
        } else {
            filter.parentId = null;
        }

        // Get total count for pagination
        const totalItems = await prisma.comment.count({
            where: filter,
        });

        // Fetch comments with user info and counts
        const comments = await prisma.comment.findMany({
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
                        creatorVerified: true,
                    },
                },
                _count: {
                    select: {
                        replies: true,
                    },
                },
            },
            skip,
            take: limit,
        });

        // Transform comments to include counts directly
        const transformedComments = comments.map((comment) => ({
            id: comment.id,
            text: comment.text,
            userId: comment.userId,
            videoId: comment.videoId,
            parentId: comment.parentId,
            user: comment.user,
            likesCount: comment.likesCount,
            repliesCount: comment._count.replies,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        }));

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / limit);

        return NextResponse.json(
            {
                success: true,
                comments: transformedComments,
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
        console.error('Get comments error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Add a comment to a video
export async function POST(request: Request, props: Params) {
    const params = await props.params;
    try {
        const { id } = params;

        // Check authentication
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the video
        const video = await prisma.video.findUnique({
            where: { id },
        });

        // Check if video exists
        if (!video) {
            return NextResponse.json(
                { success: false, message: 'Video not found' },
                { status: 404 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validationResult = addCommentSchema.safeParse(body);

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

        const { text, parentId } = validationResult.data;

        // If parentId is provided, verify it exists
        if (parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: parentId, videoId: id },
            });

            if (!parentComment) {
                return NextResponse.json(
                    { success: false, message: 'Parent comment not found' },
                    { status: 404 }
                );
            }
        }

        // Create the comment
        const comment = await prisma.comment.create({
            data: {
                text,
                userId: authUser.userId,
                videoId: id,
                parentId,
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
            },
        });

        // Create a notification for the video owner if it's not the same user
        if (video.userId !== authUser.userId) {
            await prisma.notification.create({
                data: {
                    type: parentId ? 'reply' : 'comment',
                    message: parentId
                        ? `${authUser.username} replied to a comment on your video`
                        : `${authUser.username} commented on your video`,
                    userId: video.userId,
                    causerUserId: authUser.userId,
                    videoId: id,
                },
            });
        }

        // If this is a reply, also notify the parent comment author
        if (parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { userId: true },
            });

            if (parentComment && parentComment.userId !== authUser.userId && parentComment.userId !== video.userId) {
                await prisma.notification.create({
                    data: {
                        type: 'reply',
                        message: `${authUser.username} replied to your comment`,
                        userId: parentComment.userId,
                        causerUserId: authUser.userId,
                        videoId: id,
                    },
                });
            }
        }

        // Update analytics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.videoInsight.upsert({
            where: {
                videoId_date: {
                    videoId: id,
                    date: today,
                },
            },
            update: {
                commentCount: { increment: 1 },
            },
            create: {
                videoId: id,
                userId: video.userId,
                date: today,
                viewCount: 0,
                uniqueViewerCount: 0,
                likeCount: 0,
                commentCount: 1,
                shareCount: 0,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Comment added successfully',
                comment,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Add comment error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}