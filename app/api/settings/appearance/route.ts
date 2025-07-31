/**
 * @swagger
 * /settings/appearance:
 *   get:
 *     summary: Get appearance settings
 *     description: >
 *       Retrieves the appearance settings for the authenticated user,
 *       including dark mode preference.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appearance settings retrieved successfully
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
 *                     darkMode:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or settings not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update appearance settings
 *     description: >
 *       Updates the appearance settings for the authenticated user.
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
 *               darkMode:
 *                 type: boolean
 *                 description: Whether to enable dark mode
 *     responses:
 *       200:
 *         description: Appearance settings updated successfully
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

// Validation schema for appearance settings update
const appearanceSettingsSchema = z.object({
    darkMode: z.boolean().optional(),
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

        // Check if user has settings record
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: authUser.userId },
            select: {
                darkMode: true,
            },
        });

        // If no settings found, create with defaults
        if (!userSettings) {
            const newSettings = await prisma.userSettings.create({
                data: {
                    userId: authUser.userId,
                    darkMode: false,
                },
            });

            return NextResponse.json(
                {
                    success: true,
                    settings: {
                        darkMode: newSettings.darkMode,
                    },
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                settings: {
                    darkMode: userSettings.darkMode,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get appearance settings error:', error);
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
        const validationResult = appearanceSettingsSchema.safeParse(body);
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
        const updateData: { darkMode?: boolean } = {};
        if (validationResult.data.darkMode !== undefined) {
            updateData.darkMode = validationResult.data.darkMode;
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
                darkMode: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Appearance settings updated successfully',
                settings: {
                    darkMode: updatedSettings.darkMode,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update appearance settings error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
