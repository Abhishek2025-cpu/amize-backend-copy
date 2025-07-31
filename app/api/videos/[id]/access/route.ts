/**
 * @swagger
 * /videos/{id}/access:
 *   patch:
 *     summary: Update video access settings
 *     description: >
 *       Updates the access settings for a video, controlling whether it's public or premium content.
 *       Only the video owner or an admin can update these settings.
 *     tags:
 *       - Videos
 *       - Content Monetization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPublic
 *             properties:
 *               isPublic:
 *                 type: boolean
 *                 description: Whether the video is public (true) or premium/subscribers-only (false)
 *     responses:
 *       200:
 *         description: Video access settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to modify this video or monetization not enabled
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for video access update
const updateAccessSchema = z.object({
    isPublic: z.boolean({
        required_error: "isPublic setting is required",
        invalid_type_error: "isPublic must be a boolean",
    }),
});

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const videoId = params.id;

        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the video
        const video = await prisma.video.findUnique({
            where: { id: videoId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        role: true,
                        isEligibleForCreator: true,
                        monetizationEnabled: true,
                    },
                },
            },
        });

        if (!video) {
            return NextResponse.json(
                { success: false, message: 'Video not found' },
                { status: 404 }
            );
        }

        // Check authorization - only video owner or admin can update
        const isAdmin = (await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: { role: true },
        }))?.role === 'ADMIN';

        if (video.userId !== authUser.userId && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'You are not authorized to update this video' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = updateAccessSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation error',
                    errors: validationResult.error.errors
                },
                { status: 400 }
            );
        }

        const { isPublic } = validationResult.data;

        // If setting to premium (not public), verify creator has monetization enabled
        if (!isPublic && !video.user.monetizationEnabled && !isAdmin) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'You cannot set videos to premium content because monetization is not enabled for your account',
                    monetizationStatus: {
                        isEligibleForCreator: video.user.isEligibleForCreator,
                        monetizationEnabled: video.user.monetizationEnabled,
                    }
                },
                { status: 403 }
            );
        }

        // Update the video access setting
        const updatedVideo = await prisma.video.update({
            where: { id: videoId },
            data: {
                isPublic,
            },
            select: {
                id: true,
                title: true,
                isPublic: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: isPublic
                    ? 'Video is now public and available to everyone'
                    : 'Video is now premium content available only to your subscribers',
                video: updatedVideo,
                accessType: isPublic ? 'public' : 'subscribers-only',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update video access error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}