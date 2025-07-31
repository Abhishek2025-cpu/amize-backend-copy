/**
 * @swagger
 * /security/password:
 *   put:
 *     summary: Change password
 *     description: >
 *       Updates the password for the authenticated user after verifying the current password.
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
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: User's current password
 *               newPassword:
 *                 type: string
 *                 description: New password (must meet strength requirements)
 *               confirmPassword:
 *                 type: string
 *                 description: Confirmation of new password (must match newPassword)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or passwords don't match
 *       401:
 *         description: Unauthorized or incorrect current password
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

// Password strength validation helper
function isStrongPassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
        return { isValid: false, message: "Password must be at least 8 characters long" };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one number" };
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one special character" };
    }

    return { isValid: true, message: "" };
}

// Validation schema for password change
const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
}).superRefine((data, ctx) => {
    const result = isStrongPassword(data.newPassword);
    if (!result.isValid) {
        ctx.addIssue({
            path: ["newPassword"],
            code: z.ZodIssueCode.custom,
            message: result.message,
        });
    }

    if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
            path: ["confirmPassword"],
            code: z.ZodIssueCode.custom,
            message: "Passwords don't match",
        });
    }
});

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
        const validationResult = passwordChangeSchema.safeParse(body);
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

        const { currentPassword, newPassword } = validationResult.data;

        // Verify current password
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

        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Current password is incorrect' },
                { status: 401 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                passwordHash: hashedPassword,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Password changed successfully',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Change password error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}