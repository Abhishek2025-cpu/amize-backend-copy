/**
 * @swagger
 * /settings/social:
 *   get:
 *     summary: Get social media connections
 *     description: >
 *       Retrieves the social media accounts connected to the user's profile.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Social media connections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 connections:
 *                   type: object
 *                   properties:
 *                     instagram:
 *                       type: object
 *                       properties:
 *                         connected:
 *                           type: boolean
 *                         handle:
 *                           type: string
 *                     facebook:
 *                       type: object
 *                       properties:
 *                         connected:
 *                           type: boolean
 *                         handle:
 *                           type: string
 *                     twitter:
 *                       type: object
 *                       properties:
 *                         connected:
 *                           type: boolean
 *                         handle:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update social media connection
 *     description: >
 *       Updates a social media connection for the authenticated user.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
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
 *                 enum: [instagram, facebook, twitter]
 *                 description: Social media platform
 *               handle:
 *                 type: string
 *                 description: Social media handle/username
 *     responses:
 *       200:
 *         description: Social media connection updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Remove social media connection
 *     description: >
 *       Removes a social media connection for the authenticated user.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
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
 *                 enum: [instagram, facebook, twitter]
 *                 description: Social media platform to disconnect
 *     responses:
 *       200:
 *         description: Social media connection removed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for social media connection update
const socialConnectionUpdateSchema = z.object({
    platform: z.enum(['instagram', 'facebook', 'twitter']),
    handle: z.string().min(1, "Handle cannot be empty")
        .max(30, "Handle cannot exceed 30 characters")
        .optional(),
});

// Validation schema for social media connection removal
const socialConnectionRemovalSchema = z.object({
    platform: z.enum(['instagram', 'facebook', 'twitter']),
});

export async function GET(request: Request) {
    try {
        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user's social media connections
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: authUser.userId },
            select: {
                instagramHandle: true,
                facebookHandle: true,
                twitterHandle: true,
            },
        });

        // If no settings found, create with empty values
        if (!userSettings) {
            const newSettings = await prisma.userSettings.create({
                data: {
                    userId: authUser.userId,
                    instagramHandle: null,
                    facebookHandle: null,
                    twitterHandle: null,
                },
            });

            return NextResponse.json(
                {
                    success: true,
                    connections: {
                        instagram: {
                            connected: false,
                            handle: null,
                        },
                        facebook: {
                            connected: false,
                            handle: null,
                        },
                        twitter: {
                            connected: false,
                            handle: null,
                        },
                    },
                },
                { status: 200 }
            );
        }

        // Format response
        return NextResponse.json(
            {
                success: true,
                connections: {
                    instagram: {
                        connected: !!userSettings.instagramHandle,
                        handle: userSettings.instagramHandle,
                    },
                    facebook: {
                        connected: !!userSettings.facebookHandle,
                        handle: userSettings.facebookHandle,
                    },
                    twitter: {
                        connected: !!userSettings.twitterHandle,
                        handle: userSettings.twitterHandle,
                    },
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get social media connections error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = socialConnectionUpdateSchema.safeParse(body);
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

        const { platform, handle } = validationResult.data;

        // Prepare update data based on platform
        const updateData: any = {};
        switch (platform) {
            case 'instagram':
                updateData.instagramHandle = handle;
                break;
            case 'facebook':
                updateData.facebookHandle = handle;
                break;
            case 'twitter':
                updateData.twitterHandle = handle;
                break;
        }

        // Update or create user settings
        const updatedSettings = await prisma.userSettings.upsert({
            where: { userId: authUser.userId },
            update: updateData,
            create: {
                userId: authUser.userId,
                ...updateData,
            },
            select: {
                instagramHandle: true,
                facebookHandle: true,
                twitterHandle: true,
            },
        });

        // Format response
        const connections = {
            instagram: {
                connected: !!updatedSettings.instagramHandle,
                handle: updatedSettings.instagramHandle,
            },
            facebook: {
                connected: !!updatedSettings.facebookHandle,
                handle: updatedSettings.facebookHandle,
            },
            twitter: {
                connected: !!updatedSettings.twitterHandle,
                handle: updatedSettings.twitterHandle,
            },
        };

        return NextResponse.json(
            {
                success: true,
                message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} connection updated successfully`,
                connections,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update social media connection error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = socialConnectionRemovalSchema.safeParse(body);
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

        const { platform } = validationResult.data;

        // Prepare update data based on platform
        const updateData: any = {};
        switch (platform) {
            case 'instagram':
                updateData.instagramHandle = null;
                break;
            case 'facebook':
                updateData.facebookHandle = null;
                break;
            case 'twitter':
                updateData.twitterHandle = null;
                break;
        }

        // Update user settings
        const updatedSettings = await prisma.userSettings.upsert({
            where: { userId: authUser.userId },
            update: updateData,
            create: {
                userId: authUser.userId,
                ...updateData,
            },
            select: {
                instagramHandle: true,
                facebookHandle: true,
                twitterHandle: true,
            },
        });

        // Format response
        const connections = {
            instagram: {
                connected: !!updatedSettings.instagramHandle,
                handle: updatedSettings.instagramHandle,
            },
            facebook: {
                connected: !!updatedSettings.facebookHandle,
                handle: updatedSettings.facebookHandle,
            },
            twitter: {
                connected: !!updatedSettings.twitterHandle,
                handle: updatedSettings.twitterHandle,
            },
        };

        return NextResponse.json(
            {
                success: true,
                message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} connection removed successfully`,
                connections,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Remove social media connection error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}