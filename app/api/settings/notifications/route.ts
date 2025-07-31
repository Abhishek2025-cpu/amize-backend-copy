/**
 * @swagger
 * /settings/notifications:
 *   get:
 *     summary: Get notification settings
 *     description: >
 *       Retrieves the notification preferences for the authenticated user.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's notification settings
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
 *                     push:
 *                       type: object
 *                     email:
 *                       type: object
 *                     doNotDisturb:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update notification settings
 *     description: >
 *       Updates the notification preferences for the authenticated user.
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
 *               push:
 *                 type: object
 *                 properties:
 *                   likes:
 *                     type: boolean
 *                   comments:
 *                     type: boolean
 *                   follows:
 *                     type: boolean
 *                   mentions:
 *                     type: boolean
 *                   directMessages:
 *                     type: boolean
 *                   newVideosFromFollowing:
 *                     type: boolean
 *                   subscriptionUpdates:
 *                     type: boolean
 *               email:
 *                 type: object
 *                 properties:
 *                   weeklyDigest:
 *                     type: boolean
 *                   accountUpdates:
 *                     type: boolean
 *                   subscriptionRenewals:
 *                     type: boolean
 *                   newSubscribers:
 *                     type: boolean
 *               doNotDisturb:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   startTime:
 *                     type: string
 *                     pattern: ^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$
 *                   endTime:
 *                     type: string
 *                     pattern: ^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$
 *                   timezone:
 *                     type: string
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
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

// Validation schema for the notification settings structure
const notificationSettingsSchema = z.object({
    push: z.object({
        likes: z.boolean().optional().default(true),
        comments: z.boolean().optional().default(true),
        follows: z.boolean().optional().default(true),
        mentions: z.boolean().optional().default(true),
        directMessages: z.boolean().optional().default(true),
        newVideosFromFollowing: z.boolean().optional().default(true),
        subscriptionUpdates: z.boolean().optional().default(true),
    }).optional(),

    email: z.object({
        weeklyDigest: z.boolean().optional().default(true),
        accountUpdates: z.boolean().optional().default(true),
        subscriptionRenewals: z.boolean().optional().default(true),
        newSubscribers: z.boolean().optional().default(true),
    }).optional(),

    doNotDisturb: z.object({
        enabled: z.boolean().optional().default(false),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().default("22:00"),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().default("08:00"),
        timezone: z.string().optional().default("UTC"),
    }).optional(),
}).strict();

// Default notification settings
const defaultNotificationSettings = {
    push: {
        likes: true,
        comments: true,
        follows: true,
        mentions: true,
        directMessages: true,
        newVideosFromFollowing: true,
        subscriptionUpdates: true,
    },
    email: {
        weeklyDigest: true,
        accountUpdates: true,
        subscriptionRenewals: true,
        newSubscribers: true,
    },
    doNotDisturb: {
        enabled: false,
        startTime: "22:00",
        endTime: "08:00",
        timezone: "UTC",
    },
};

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

        // Get user details with notification settings
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                id: true,
                notificationSettings: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Parse notification settings or return defaults if not set
        let settings = defaultNotificationSettings;

        if (user.notificationSettings) {
            try {
                settings = JSON.parse(user.notificationSettings);
            } catch (error) {
                console.error('Error parsing notification settings:', error);
                // Fall back to defaults if parsing fails
            }
        }

        return NextResponse.json(
            {
                success: true,
                settings,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get notification settings error:', error);
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
        const validationResult = notificationSettingsSchema.safeParse(body);
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

        // Get existing settings
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                id: true,
                notificationSettings: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Parse existing settings or use defaults
        let currentSettings = defaultNotificationSettings;
        if (user.notificationSettings) {
            try {
                currentSettings = JSON.parse(user.notificationSettings);
            } catch (error) {
                console.error('Error parsing existing notification settings:', error);
            }
        }

        // Merge existing settings with updates (deep merge)
        const updatedSettings = {
            ...currentSettings,
            ...validationResult.data,
            push: {
                ...currentSettings.push,
                ...validationResult.data.push,
            },
            email: {
                ...currentSettings.email,
                ...validationResult.data.email,
            },
            doNotDisturb: {
                ...currentSettings.doNotDisturb,
                ...validationResult.data.doNotDisturb,
            },
        };

        // Update notification settings
        await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                notificationSettings: JSON.stringify(updatedSettings),
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Notification settings updated successfully',
                settings: updatedSettings,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update notification settings error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}