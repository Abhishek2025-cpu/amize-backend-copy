/**
 * @swagger
 * /videos/{id}/share:
 *   post:
 *     summary: Record a video share
 *     description: >
 *       Records when a user shares a video to a specific platform.
 *       Used for analytics and tracking viral spread.
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
 *               - platform
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [whatsapp, facebook, instagram, twitter, copy_link, other]
 *                 description: Platform where the video was shared
 *     responses:
 *       200:
 *         description: Share recorded successfully
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
 *                   example: Share recorded successfully
 *                 sharesCount:
 *                   type: integer
 *                   description: Updated share count for the video
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
 *                   example: Invalid platform
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

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

interface Params {
    params: Promise<{
        id: string;
    }>;
}

// Define valid platforms
const VALID_PLATFORMS = [
    'whatsapp',
    'facebook',
    'instagram',
    'twitter',
    'copy_link',
    'other'
] as const;

// Validation schema for recording a share
const recordShareSchema = z.object({
    platform: z.enum(VALID_PLATFORMS, {
        errorMap: () => ({ message: `Platform must be one of: ${VALID_PLATFORMS.join(', ')}` })
    }),
});

export async function POST(request: Request, props: Params) {
    const params = await props.params;
    try {
        const { id } = params;

        // Check authentication (optional - anonymous shares are allowed)
        const authUser = await getAuthUser(request);

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

        // Check if video is public or user is the owner
        if (!video.isPublic && (!authUser || authUser.userId !== video.userId)) {
            return NextResponse.json(
                { success: false, message: 'This video is private' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validationResult = recordShareSchema.safeParse(body);

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

        const { platform } = validationResult.data;

        // Record the share
        await prisma.share.create({
            data: {
                videoId: id,
                platform,
                userId: authUser?.userId,
            },
        });

        // Get updated share count
        const sharesCount = await prisma.share.count({
            where: { videoId: id },
        });

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
                shareCount: { increment: 1 },
            },
            create: {
                videoId: id,
                userId: video.userId,
                date: today,
                viewCount: 0,
                uniqueViewerCount: 0,
                likeCount: 0,
                commentCount: 0,
                shareCount: 1,
            },
        });

        // Create a notification for the video owner if it's a different user
        if (authUser && video.userId !== authUser.userId) {
            await prisma.notification.create({
                data: {
                    type: 'share',
                    message: `${authUser.username} shared your video on ${platform}`,
                    userId: video.userId,
                    causerUserId: authUser.userId,
                    videoId: id,
                },
            });
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Share recorded successfully',
                sharesCount,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Record share error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}