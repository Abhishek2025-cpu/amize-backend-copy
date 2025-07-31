/**
 * @swagger
 * /account/delete:
 *   post:
 *     summary: Delete user account
 *     description: >
 *       Initiates the account deletion process by requiring password confirmation.
 *       The account is soft-deleted (deactivated) rather than permanently deleted.
 *     tags:
 *       - Account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - reason
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

// Validation schema for account deletion
const accountDeletionSchema = z.object({
    password: z.string().min(1, "Password is required"),
    reason: z.string().min(1, "Please provide a reason for deletion"),
    feedback: z.string().optional(),
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

        const body = await request.json();

        // Validate request body
        const validationResult = accountDeletionSchema.safeParse(body);
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

        const { password, reason, feedback } = validationResult.data;

        // Verify the password
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                passwordHash: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Incorrect password' },
                { status: 401 }
            );
        }

        // Store deletion reason and feedback
        const deletionInfo = {
            reason,
            feedback: feedback || '',
            deletedAt: new Date().toISOString(),
        };

        // Soft delete (deactivate) the account
        await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                deactivatedAt: new Date(),
                bio: JSON.stringify(deletionInfo), // Temporarily store deletion info in bio
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Account deactivated successfully. You can recover your account within 30 days by logging in again.',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Delete account error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}