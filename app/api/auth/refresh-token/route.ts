/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh authentication token
 *     description: >
 *       Generates a new access token and refresh token using a valid refresh token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Successfully generated new tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: New access token
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token
 *       400:
 *         description: Validation error
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
 *                   description: Error message
 *                 errors:
 *                   type: array
 *                   description: Detailed validation errors
 *                   items:
 *                     type: object
 *       401:
 *         description: Invalid refresh token
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
 *                   example: Invalid refresh token
 *       403:
 *         description: Inactive or suspended account
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
 *                   example: Your account is inactive or suspended
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
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Request body validation schema
const refreshTokenSchema = z.object({
    refreshToken: z.string(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = refreshTokenSchema.safeParse(body);
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

        const { refreshToken } = validationResult.data;

        try {
            // Verify refresh token
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET as string
            ) as { userId: string };

            // Find user
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
            });

            if (!user) {
                return NextResponse.json(
                    { success: false, message: 'Invalid refresh token' },
                    { status: 401 }
                );
            }

            // Check if user is deactivated
            if (user.deactivatedAt) {
                return NextResponse.json(
                    { success: false, message: 'Your account is inactive or suspended' },
                    { status: 403 }
                );
            }

            // Generate new JWT token
            const newToken = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    username: user.username
                },
                process.env.JWT_SECRET as string,
                { expiresIn: '24h' }
            );

            // Generate new refresh token
            const newRefreshToken = jwt.sign(
                { userId: user.id },
                process.env.JWT_REFRESH_SECRET as string,
                { expiresIn: '7d' }
            );

            return NextResponse.json(
                {
                    success: true,
                    token: newToken,
                    refreshToken: newRefreshToken,
                },
                { status: 200 }
            );
        } catch (jwtError) {
            return NextResponse.json(
                { success: false, message: 'Invalid refresh token' },
                { status: 401 }
            );
        }
    } catch (error: any) {
        console.error('Refresh token error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}