/**
 * @swagger
 * /videos/{id}:
 *   get:
 *     summary: Get a single video by ID
 *     description: >
 *       Retrieves a single video with detailed information.
 *       Optionally records a view if specified.
 *     tags:
 *       - Videos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *       - in: query
 *         name: recordView
 *         schema:
 *           type: boolean
 *         description: Whether to record a view for this request
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
 *                     user:
 *                       type: object
 *                     sound:
 *                       type: object
 *                     likesCount:
 *                       type: integer
 *                     commentsCount:
 *                       type: integer
 *                     viewsCount:
 *                       type: integer
 *                     sharesCount:
 *                       type: integer
 *                     hasLiked:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
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
 *
 *   patch:
 *     summary: Update a video
 *     description: >
 *       Updates a video's details. Only the video owner can update it.
 *     tags:
 *       - Videos
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               soundId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video updated successfully
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
 *                   example: Video updated successfully
 *                 video:
 *                   type: object
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
 *         description: Forbidden
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
 *                   example: You do not have permission to update this video
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
 *   delete:
 *     summary: Delete a video
 *     description: >
 *       Deletes a video. Only the video owner can delete it.
 *     tags:
 *       - Videos
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
 *         description: Video deleted successfully
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
 *                   example: Video deleted successfully
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
 *         description: Forbidden
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
 *                   example: You do not have permission to delete this video
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
import { getAuthUser, isAdmin } from '@/lib/auth';
import { z } from 'zod';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

import { prisma } from '@/lib/prisma';

interface Params {
    params: Promise<{
        id: string;
    }>;
}

// Validation schema for updating video
const updateVideoSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
    soundId: z.string().uuid().optional().nullable(),
});

// Get Video by ID
export async function GET(request: Request, props: Params) {
    const params = await props.params;
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const recordView = searchParams.get('recordView') === 'true';

        // Get authentication (optional for public videos)
        const authUser = await getAuthUser(request);

        // Get the video with related data
        const video = await prisma.video.findUnique({
            where: { id },
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
        });

        // Check if video exists
        if (!video) {
            return NextResponse.json(
                { success: false, message: 'Video not found' },
                { status: 404 }
            );
        }

        // Check access to private videos
        if (!video.isPublic) {
            const canAccess = authUser && (
                authUser.userId === video.userId ||
                isAdmin(authUser)
            );

            if (!canAccess) {
                return NextResponse.json(
                    { success: false, message: 'This video is private' },
                    { status: 403 }
                );
            }
        }

        // Check if the authenticated user has liked this video
        let hasLiked = false;
        if (authUser) {
            const userLike = await prisma.like.findUnique({
                where: {
                    userId_videoId: {
                        userId: authUser.userId,
                        videoId: id,
                    },
                },
            });
            hasLiked = !!userLike;
        }

        // Record a view if requested and user is authenticated
        if (recordView && authUser) {
            // Get the client IP address for unique view counting
            const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

            // Create a view history record
            await prisma.viewHistory.create({
                data: {
                    user: { connect: { id: authUser.userId } },
                    video: { connect: { id } },
                    watchTime: 0, // Initial watch time, will be updated later
                    completionRate: 0, // Initial completion rate, will be updated later
                },
            });

            // For analytics purposes
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Update or create video insight for today
            await prisma.videoInsight.upsert({
                where: {
                    videoId_date: {
                        videoId: id,
                        date: today,
                    },
                },
                update: {
                    viewCount: { increment: 1 },
                    uniqueViewerCount: { increment: 1 }, // This is simplified, should check for unique viewers
                },
                create: {
                    videoId: id,
                    userId: video.userId,
                    date: today,
                    viewCount: 1,
                    uniqueViewerCount: 1,
                    likeCount: 0,
                    commentCount: 0,
                    shareCount: 0,
                },
            });
        }

        // Transform video for response
        const videoResponse = {
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
            hasLiked,
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
        };

        return NextResponse.json(
            {
                success: true,
                video: videoResponse,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get video error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update Video
export async function PATCH(request: Request, props: Params) {
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

        // Check if user has permission (video owner or admin)
        const isUserAdmin = isAdmin(authUser);
        if (video.userId !== authUser.userId && !isUserAdmin) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to update this video' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validationResult = updateVideoSchema.safeParse(body);

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

        const { title, description, isPublic, soundId } = validationResult.data;

        // Prepare update data
        const updateData: any = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (isPublic !== undefined) updateData.isPublic = isPublic;

        // Handle sound relationship
        if (soundId === null) {
            // Remove sound association
            updateData.sound = { disconnect: true };
        } else if (soundId !== undefined) {
            // Verify sound exists
            const sound = await prisma.sound.findUnique({
                where: { id: soundId },
            });

            if (!sound) {
                return NextResponse.json(
                    { success: false, message: 'Sound not found' },
                    { status: 404 }
                );
            }

            // Connect to new sound
            updateData.sound = { connect: { id: soundId } };
        }

        // Update the video
        const updatedVideo = await prisma.video.update({
            where: { id },
            data: updateData,
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
                message: 'Video updated successfully',
                video: updatedVideo,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update video error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete Video
export async function DELETE(request: Request, props: Params) {
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

        // Check if user has permission (video owner or admin)
        const isUserAdmin = isAdmin(authUser);
        if (video.userId !== authUser.userId && !isUserAdmin) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to delete this video' },
                { status: 403 }
            );
        }

        // Optional: Find the original upload to delete the file
        // Note: This is optional as you might want to keep the files
        const videoFilePath = video.videoUrl;
        const thumbnailFilePath = video.thumbnailUrl;

        if (videoFilePath) {
            const fullVideoPath = `public${videoFilePath}`;
            if (existsSync(fullVideoPath)) {
                try {
                    await unlink(fullVideoPath);
                } catch (err) {
                    console.error(`Failed to delete video file at ${fullVideoPath}:`, err);
                }
            }
        }

        if (thumbnailFilePath) {
            const fullThumbnailPath = `public${thumbnailFilePath}`;
            if (existsSync(fullThumbnailPath)) {
                try {
                    await unlink(fullThumbnailPath);
                } catch (err) {
                    console.error(`Failed to delete thumbnail file at ${fullThumbnailPath}:`, err);
                }
            }
        }

        // Delete the video (the cascade setting should handle related records)
        await prisma.video.delete({
            where: { id },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Video deleted successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete video error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}