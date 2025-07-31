/**
 * @swagger
 * /videos/{id}/like:
 *   post:
 *     summary: Like or unlike a video
 *     description: >
 *       Toggles the like status for the authenticated user on a specific video.
 *       If the user has already liked the video, the like is removed (unlike).
 *       If the user has not liked the video, a new like is created.
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
 *     responses:
 *       200:
 *         description: Like status toggled successfully
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
 *                   example: Video liked successfully
 *                 liked:
 *                   type: boolean
 *                   description: Current like status after the operation
 *                 likesCount:
 *                   type: integer
 *                   description: Updated like count for the video
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
 *       403:
 *         description: Forbidden - Private video
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
 *                   example: This video is private
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
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

interface Params {
    params: Promise<{
        id: string;
    }>;
}

/**
 * @swagger
 * /videos/{id}/like:
 *   get:
 *     summary: Check if a video is liked by the current user
 *     description: Returns the like status of a video for the authenticated user
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
 *     responses:
 *       200:
 *         description: Like status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 liked:
 *                   type: boolean
 *                   description: Whether the user has liked this video
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
 */
export async function GET(request: Request, props: Params) {
    const params = await props.params;
    try {
        const { id } = params;

        // Check authentication
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized', liked: false },
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
                { success: false, message: 'Video not found', liked: false },
                { status: 404 }
            );
        }

        // Check if user has liked the video
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_videoId: {
                    userId: authUser.userId,
                    videoId: id,
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                liked: !!existingLike, // Convert to boolean
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Check like status error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error', liked: false },
            { status: 500 }
        );
    }
}

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

        // Check access to private videos
        if (!video.isPublic && video.userId !== authUser.userId) {
            return NextResponse.json(
                { success: false, message: 'This video is private' },
                { status: 403 }
            );
        }

        // Check if user has already liked the video
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_videoId: {
                    userId: authUser.userId,
                    videoId: id,
                },
            },
        });

        let liked = false;
        let message = '';

        // If like exists, remove it (unlike)
        if (existingLike) {
            await prisma.like.delete({
                where: {
                    userId_videoId: {
                        userId: authUser.userId,
                        videoId: id,
                    },
                },
            });

            message = 'Video unliked successfully';
            liked = false;
        } else {
            // Otherwise, create a new like
            await prisma.like.create({
                data: {
                    userId: authUser.userId,
                    videoId: id,
                },
            });

            message = 'Video liked successfully';
            liked = true;

            // Create a notification for the video owner if it's not the same user
            if (video.userId !== authUser.userId) {
                await prisma.notification.create({
                    data: {
                        type: 'like',
                        message: `${authUser.username} liked your video`,
                        userId: video.userId,
                        causerUserId: authUser.userId,
                        videoId: id,
                    },
                });
            }

            // Update video insights for today
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
                    likeCount: { increment: 1 },
                },
                create: {
                    videoId: id,
                    userId: video.userId,
                    date: today,
                    viewCount: 0,
                    uniqueViewerCount: 0,
                    likeCount: 1,
                    commentCount: 0,
                    shareCount: 0,
                },
            });
        }

        // Get updated like count
        const likesCount = await prisma.like.count({
            where: { videoId: id },
        });

        return NextResponse.json(
            {
                success: true,
                message,
                liked,
                likesCount,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Toggle like error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}