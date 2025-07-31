/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: >
 *       Initiates a password reset process by sending a reset link to the user's email.
 *       Provides a secure method that doesn't reveal whether an email exists in the system.
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
 *                 format: email
 *                 description: Email address of the user requesting password reset
 *     responses:
 *       200:
 *         description: Password reset request processed
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
 *                   example: If your email is registered, you will receive a reset link shortly
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
import crypto from 'crypto';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

import { prisma } from '@/lib/prisma';

// Request body validation schema
const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = forgotPasswordSchema.safeParse(body);
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

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // For security reasons, always return success even if the email doesn't exist
        if (!user || user.deactivatedAt) {
            return NextResponse.json(
                { success: true, message: 'If your email is registered, you will receive a reset link shortly' },
                { status: 200 }
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Store reset token in database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                forgotPasswordToken: resetToken,
                forgotPasswordExpiry: resetTokenExpiry,
            },
        });

        // Prepare reset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Send email
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Please use the following link to reset your password: ${resetLink}`,
            html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this reset, please ignore this email.</p>
      `,
        });

        return NextResponse.json(
            { success: true, message: 'If your email is registered, you will receive a reset link shortly' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}