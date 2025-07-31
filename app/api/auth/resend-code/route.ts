/**
 * @swagger
 * /auth/resend-code:
 *   post:
 *     summary: Resend verification code
 *     description: >
 *       Generates a new verification code and sends it to the user's email.
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
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email address of the user
 *     responses:
 *       200:
 *         description: Verification code sent successfully
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
 *                   example: Verification code sent to your email
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
import { generateVerificationCode, sendVerificationCodeEmail } from '@/lib/email';

import { prisma } from '@/lib/prisma';

// Request body validation schema
const resendCodeSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = resendCodeSchema.safeParse(body);
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

        const { email } = validationResult.data;

        // Find user with this email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user is already verified
        if (user.verified) {
            return NextResponse.json(
                { success: false, message: 'User is already verified' },
                { status: 400 }
            );
        }

        // Generate a new 6-digit verification code
        const verificationCode = generateVerificationCode(6);

        // Set expiration time (10 minutes from now)
        const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Update user with new verification code
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationCode,
                verificationCodeExpiry,
            },
        });

        // Send verification email with code
        await sendVerificationCodeEmail(
            email,
            user.firstName,
            verificationCode
        );

        // For development/testing, include the code in the response
        // In production, remove this or use a feature flag
        const devInfo = process.env.NODE_ENV === 'development' ? { verificationCode } : {};

        return NextResponse.json(
            {
                success: true,
                message: 'A new verification code has been sent to your email',
                ...devInfo
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Resend code error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}