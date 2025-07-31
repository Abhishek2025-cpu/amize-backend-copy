/**
 * @swagger
 * /settings/privacy:
 *   get:
 *     summary: Get privacy settings
 *     description: >
 *       Retrieves the privacy settings for the authenticated user.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Privacy settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 settings:
 *                   type: object
 *                   properties:
 *                     isPrivate:
 *                       type: boolean
 *                       description: Whether the account is private
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update privacy settings
 *     description: >
 *       Updates the privacy settings for the authenticated user.
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
 *             properties:
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether to make the account private
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
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

// Validation schema for privacy settings update
const privacySettingsSchema = z.object({
    isPrivate: z.boolean().optional(),
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

        // Get user's privacy settings
        const settings = await prisma.userSettings.findUnique({
            where: { userId: authUser.userId },
            select: {
                isPrivate: true,
            },
        });

        let isPrivate = false; // Default

        if (settings) {
            isPrivate = settings.isPrivate;
        } else {
            // Create settings if they don't exist
            await prisma.userSettings.create({
                data: {
                    userId: authUser.userId,
                    isPrivate,
                },
            });
        }

        return NextResponse.json(
            {
                success: true,
                settings: {
                    isPrivate,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get privacy settings error:', error);
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
        const validationResult = privacySettingsSchema.safeParse(body);
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

        // Get only the fields that were provided
        const updateData: { isPrivate?: boolean } = {};
        if (validationResult.data.isPrivate !== undefined) {
            updateData.isPrivate = validationResult.data.isPrivate;
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
                isPrivate: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Privacy settings updated successfully',
                settings: {
                    isPrivate: updatedSettings.isPrivate,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update privacy settings error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
