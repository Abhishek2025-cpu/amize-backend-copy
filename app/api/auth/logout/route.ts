/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: >
 *       Logs out the authenticated user by marking their current device session as inactive.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: Unique identifier of the device to be logged out
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized access
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
 *       500:
 *         description: Internal server error
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

// Request body validation schema
const logoutSchema = z.object({
    deviceId: z.string(),
});

export async function POST(request: Request) {
    try {
        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log(authUser);
        // Get device ID from request body
        const body = await request.json();
        console.log(body);
        // Validate request body
        const validationResult = logoutSchema.safeParse(body);
        if (!validationResult.success) {
            console.error('Validation error:', validationResult.error);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation error',
                    errors: validationResult.error.errors
                },
                { status: 400 }
            );
        }

        const { deviceId } = validationResult.data;

        // Update device history record
        await prisma.deviceHistory.updateMany({
            where: {
                userId: authUser.userId,
                deviceId: deviceId,
                isActive: true,
            },
            data: {
                isActive: false,
                logoutTimestamp: new Date(),
            },
        });

        return NextResponse.json(
            { success: true, message: 'Logout successful' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}