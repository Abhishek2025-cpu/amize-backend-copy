/**
 * @swagger
 * /account:
 *   get:
 *     summary: Get account information
 *     description: >
 *       Retrieves account information for the authenticated user,
 *       including email, phone number, and date of birth.
 *     tags:
 *       - Account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account information retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update account information
 *     description: >
 *       Updates account information for the authenticated user.
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
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date-time
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for account information update
const accountUpdateSchema = z.object({
    phoneNumber: z.string().regex(/^\+?[0-9\s\-\(\)]{7,15}$/, {
        message: "Invalid phone number format",
    }).optional(),
    address: z.string().max(255, "Address cannot exceed 255 characters").optional(),
    dateOfBirth: z.string().optional().transform(val => val ? new Date(val) : undefined)
        .refine(val => !val || !isNaN(val.getTime()), {
            message: "Invalid date format",
        })
        .refine(val => {
            if (!val) return true;

            // Check if the user is at least 13 years old
            const now = new Date();
            const minimumAge = 13;
            const minimumBirthDate = new Date(
                now.getFullYear() - minimumAge,
                now.getMonth(),
                now.getDate()
            );

            return val <= minimumBirthDate;
        }, {
            message: "You must be at least 13 years old",
        }),
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

        // Get user account information including settings
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                id: true,
                email: true,
                phoneNumber: true,
                dateOfBirth: true,
                address: true,
                verified: true,
                settings: {
                    select: {
                        isBusinessAccount: true,
                        darkMode: true,
                        language: true,
                        instagramHandle: true,
                        facebookHandle: true,
                        twitterHandle: true,
                    }
                }
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                account: user,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get account information error:', error);
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
        const validationResult = accountUpdateSchema.safeParse(body);
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

        // Update user account information
        const updatedUser = await prisma.user.update({
            where: { id: authUser.userId },
            data: validationResult.data,
            select: {
                id: true,
                email: true,
                phoneNumber: true,
                dateOfBirth: true,
                address: true,
                verified: true,
                settings: {
                    select: {
                        isBusinessAccount: true,
                        darkMode: true,
                        language: true
                    }
                }
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Account information updated successfully',
                account: updatedUser,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update account information error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}