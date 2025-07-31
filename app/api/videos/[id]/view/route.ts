/**
 * @swagger
 * /videos/{id}/view:
 *   post:
 *     summary: Record a video view
 *     description: >
 *       Records detailed view information for a video, including watch time
 *       and completion rate. Used for updating analytics.
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
 *               - watchTime
 *             properties:
 *               watchTime:
 *                 type: number
 *                 description: Time in seconds the user watched the video
 *               completionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Percentage of the video that was watched
 *     responses:
 *       200:
 *         description: View recorded successfully
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
 *                   example: View recorded successfully
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

// Validation schema for recording a view
const recordViewSchema = z.object({
    watchTime: z.number().nonnegative(),
    completionRate: z.number().min(0).max(100).optional(),
});

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
        const validationResult = recordViewSchema.safeParse(body);

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

        const { watchTime, completionRate } = validationResult.data;

        // Calculate completion rate if not provided
        let calculatedCompletionRate = completionRate;
        if (completionRate === undefined && video.duration > 0) {
            calculatedCompletionRate = Math.min(100, (watchTime / video.duration) * 100);
        }

        // Create a view history record
        await prisma.viewHistory.create({
            data: {
                userId: authUser.userId,
                videoId: id,
                watchTime,
                completionRate: calculatedCompletionRate,
            },
        });

        // For analytics purposes, update or create video insight for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if this is a new viewer today
        const existingViewsToday = await prisma.viewHistory.findFirst({
            where: {
                userId: authUser.userId,
                videoId: id,
                createdAt: {
                    gte: today,
                },
            },
        });

        const isNewViewer = !existingViewsToday;

        // First get existing insight if it exists
        const existingInsight = await prisma.videoInsight.findUnique({
            where: {
                videoId_date: {
                    videoId: id,
                    date: today,
                },
            },
        });

        if (existingInsight) {
            // Calculate updated averages manually
            const newViewCount = existingInsight.viewCount + 1;

            // Calculate new average watch time
            let newAverageWatchTime = existingInsight.averageWatchTime || 0;
            if (existingInsight.viewCount > 0) {
                const totalWatchTime = existingInsight.averageWatchTime! * existingInsight.viewCount;
                newAverageWatchTime = (totalWatchTime + watchTime) / newViewCount;
            } else {
                newAverageWatchTime = watchTime;
            }

            // Calculate new average completion rate
            let newAverageCompletionRate = existingInsight.averageCompletionRate || 0;
            if (calculatedCompletionRate !== undefined) {
                if (existingInsight.viewCount > 0) {
                    const totalCompletionRate = existingInsight.averageCompletionRate! * existingInsight.viewCount;
                    newAverageCompletionRate = (totalCompletionRate + calculatedCompletionRate) / newViewCount;
                } else {
                    newAverageCompletionRate = calculatedCompletionRate;
                }
            }

            // Update with calculated values
            await prisma.videoInsight.update({
                where: {
                    videoId_date: {
                        videoId: id,
                        date: today,
                    },
                },
                data: {
                    viewCount: { increment: 1 },
                    uniqueViewerCount: isNewViewer ? { increment: 1 } : undefined,
                    averageWatchTime: newAverageWatchTime,
                    averageCompletionRate: newAverageCompletionRate,
                },
            });
        } else {
            // Create new insight
            await prisma.videoInsight.create({
                data: {
                    videoId: id,
                    userId: video.userId,
                    date: today,
                    viewCount: 1,
                    uniqueViewerCount: 1,
                    likeCount: 0,
                    commentCount: 0,
                    shareCount: 0,
                    averageWatchTime: watchTime,
                    averageCompletionRate: calculatedCompletionRate || 0,
                },
            });
        }

        return NextResponse.json(
            {
                success: true,
                message: 'View recorded successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Record view error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}