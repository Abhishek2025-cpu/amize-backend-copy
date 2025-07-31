/**
 * @swagger
 * /auth/verify-code:
 *   post:
 *     summary: Verify user email with code
 *     description: >
 *       Verifies a user's email address using a verification code.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email address of the user
 *               code:
 *                 type: string
 *                 description: Verification code sent to the user's email
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *                   example: Email verified successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token
 *       400:
 *         description: Validation error or invalid/expired code
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
 *       404:
 *         description: User not found
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
 *                   example: User not found
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
import { z } from 'zod';
import jwt from 'jsonwebtoken';

import { prisma } from '@/lib/prisma';

// Request body validation schema
const verifyCodeSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    code: z.string().length(6, { message: "Verification code must be 6 digits" }),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body);

        // Validate request body
        const validationResult = verifyCodeSchema.safeParse(body);
        if (!validationResult.success) {
            console.error(validationResult.error.errors);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation error',
                    errors: validationResult.error.errors
                },
                { status: 400 }
            );
        }

        const { email, code } = validationResult.data;

        // Find user with this email and verification code
        const user = await prisma.user.findFirst({
            where: {
                email: email,
                verificationCode: code,
                verificationCodeExpiry: {
                    gt: new Date(), // Code must not be expired
                },
            },
            include: {
                interests: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired verification code' },
                { status: 400 }
            );
        }

        // Update user's verification status
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                verified: true,
                verificationCode: null,
                verificationCodeExpiry: null
            },
            include: {
                interests: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Generate JWT token for authentication
        const token = jwt.sign(
            {
                userId: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                username: updatedUser.username
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { userId: updatedUser.id },
            process.env.JWT_REFRESH_SECRET as string,
            { expiresIn: '7d' }
        );

        // Remove sensitive information from the response
        const {
            passwordHash,
            verificationCode: _code,
            verificationCodeExpiry: _expiry,
            forgotPasswordToken,
            forgotPasswordExpiry,
            pin,
            ...userWithoutSensitiveData
        } = updatedUser;

        return NextResponse.json(
            {
                success: true,
                message: 'Email verified successfully',
                user: userWithoutSensitiveData,
                token,
                refreshToken
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Verify code error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}