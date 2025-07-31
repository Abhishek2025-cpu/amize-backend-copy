/**
 * @swagger
 * /account/business:
 *   post:
 *     summary: Convert to business account
 *     description: >
 *       Converts a regular user account to a business account.
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
 *               businessName:
 *                 type: string
 *               businessCategory:
 *                 type: string
 *               businessEmail:
 *                 type: string
 *                 format: email
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for business account conversion
const businessAccountSchema = z.object({
    businessName: z.string().min(2, "Business name must be at least 2 characters").max(100),
    businessCategory: z.string().min(2, "Business category must be at least 2 characters"),
    businessAddress: z.string().optional(),
    businessEmail: z.string().email("Invalid email format").optional(),
    businessPhoneNumber: z.string().regex(/^\+?[0-9\s\-\(\)]{7,15}$/, {
        message: "Invalid phone number format",
    }).optional(),
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

        // Check if user already has a business account by checking settings
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            include: {
                settings: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        if (user.settings?.isBusinessAccount) {
            return NextResponse.json(
                { success: false, message: 'Account is already a business account' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = businessAccountSchema.safeParse(body);
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

        // Store business details in the database
        const businessInfo = {
            name: validationResult.data.businessName,
            category: validationResult.data.businessCategory,
            address: validationResult.data.businessAddress,
            email: validationResult.data.businessEmail,
            phone: validationResult.data.businessPhoneNumber,
        };

        // Update user settings or create if they don't exist
        let updatedSettings;
        if (user.settings) {
            updatedSettings = await prisma.userSettings.update({
                where: { userId: authUser.userId },
                data: {
                    isBusinessAccount: true
                }
            });
        } else {
            updatedSettings = await prisma.userSettings.create({
                data: {
                    userId: authUser.userId,
                    isBusinessAccount: true
                }
            });
        }

        // Update user profile with business info
        const updatedUser = await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                bio: JSON.stringify(businessInfo),
                creatorCategory: validationResult.data.businessCategory
            },
            include: {
                settings: true
            }
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Account converted to business account successfully',
                businessAccount: {
                    isBusinessAccount: updatedSettings.isBusinessAccount,
                    businessInfo: businessInfo,
                    category: updatedUser.creatorCategory,
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Convert to business account error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user has a business account
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            include: {
                settings: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        if (!user.settings?.isBusinessAccount) {
            return NextResponse.json(
                { success: false, message: 'Account is not a business account' },
                { status: 403 }
            );
        }

        // Convert back to personal account by updating settings
        await prisma.userSettings.update({
            where: { userId: authUser.userId },
            data: {
                isBusinessAccount: false
            }
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Account converted back to personal account successfully',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Convert to personal account error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}