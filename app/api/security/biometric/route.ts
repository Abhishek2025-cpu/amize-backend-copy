/**
 * @swagger
 * /security/biometric:
 *   get:
 *     summary: Get biometric authentication settings
 *     description: >
 *       Retrieves the biometric authentication settings for the authenticated user,
 *       including Face ID and fingerprint status.
 *     tags:
 *       - Security
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Biometric authentication settings retrieved successfully
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
 *                     useFaceId:
 *                       type: boolean
 *                     useFingerprint:
 *                       type: boolean
 *                     supportedMethods:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update biometric authentication settings
 *     description: >
 *       Updates the biometric authentication settings for the authenticated user.
 *     tags:
 *       - Security
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               useFaceId:
 *                 type: boolean
 *                 description: Whether to use Face ID authentication
 *               useFingerprint:
 *                 type: boolean
 *                 description: Whether to use fingerprint authentication
 *     responses:
 *       200:
 *         description: Biometric authentication settings updated successfully
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

// Validation schema for biometric settings update
const biometricSettingsSchema = z.object({
    useFaceId: z.boolean().optional(),
    useFingerprint: z.boolean().optional(),
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

        // Get user's biometric settings
        const settings = await prisma.userSettings.findUnique({
            where: { userId: authUser.userId },
            select: {
                useFaceId: true,
                useFingerprint: true,
            },
        });

        // If no settings found, create with defaults
        if (!settings) {
            const newSettings = await prisma.userSettings.create({
                data: {
                    userId: authUser.userId,
                    useFaceId: false,
                    useFingerprint: false,
                },
            });

            return NextResponse.json(
                {
                    success: true,
                    settings: {
                        useFaceId: newSettings.useFaceId,
                        useFingerprint: newSettings.useFingerprint,
                        supportedMethods: ['faceId', 'fingerprint'], // This would be device-dependent in a real app
                    },
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                settings: {
                    useFaceId: settings.useFaceId,
                    useFingerprint: settings.useFingerprint,
                    supportedMethods: ['faceId', 'fingerprint'], // This would be device-dependent in a real app
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get biometric settings error:', error);
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
        const validationResult = biometricSettingsSchema.safeParse(body);
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
        const updateData : { useFaceId?: boolean; useFingerprint?: boolean } = {};
        if (validationResult.data.useFaceId !== undefined) {
            updateData.useFaceId = validationResult.data.useFaceId;
        }
        if (validationResult.data.useFingerprint !== undefined) {
            updateData.useFingerprint = validationResult.data.useFingerprint;
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
                useFaceId: true,
                useFingerprint: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Biometric authentication settings updated successfully',
                settings: {
                    useFaceId: updatedSettings.useFaceId,
                    useFingerprint: updatedSettings.useFingerprint,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update biometric settings error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}