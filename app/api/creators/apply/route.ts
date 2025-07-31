/**
 * @swagger
 * /creators/apply:
 *   post:
 *     summary: Apply to become a content creator
 *     description: >
 *       Submit an application to become a content creator with monetization capabilities.
 *       Requires authentication and a complete profile.
 *     tags:
 *       - Creators
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentCategory
 *               - biography
 *               - reasonToBeCreator
 *             properties:
 *               contentCategory:
 *                 type: string
 *                 description: Primary category of content (e.g., "Comedy", "Education", "Music")
 *               biography:
 *                 type: string
 *                 description: Detailed creator biography
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   instagram:
 *                     type: string
 *                   twitter:
 *                     type: string
 *                   facebook:
 *                     type: string
 *                   other:
 *                     type: string
 *               reasonToBeCreator:
 *                 type: string
 *                 description: Explanation of why the user wants to be a creator
 *     responses:
 *       201:
 *         description: Creator application submitted successfully
 *       400:
 *         description: Validation error or incomplete profile
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Application already exists or user is already a creator
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for creator application
const creatorApplicationSchema = z.object({
    contentCategory: z.string().min(2, { message: "Category must be at least 2 characters" }),
    biography: z.string().min(50, { message: "Biography must be at least 50 characters" }).max(1000),
    socialLinks: z.object({
        instagram: z.string().optional(),
        twitter: z.string().optional(),
        facebook: z.string().optional(),
        other: z.string().optional(),
    }).optional(),
    reasonToBeCreator: z.string().min(50, { message: "Please provide a detailed reason" }).max(500),
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

        // Check if user exists and get relevant profile information
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                id: true,
                username: true,
                profilePhotoUrl: true,
                bio: true,
                isEligibleForCreator: true,
                role: true,
                videos: {
                    select: {
                        id: true
                    },
                    take: 1
                }
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user is already a creator or has already applied
        if (user.role === 'CREATOR' || user.isEligibleForCreator) {
            return NextResponse.json(
                {
                    success: false,
                    message: user.role === 'CREATOR'
                        ? 'You are already a creator'
                        : 'Your application is already pending or approved'
                },
                { status: 409 }
            );
        }

        // Check if profile is complete enough to apply
        if (!user.profilePhotoUrl || !user.bio) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Your profile is incomplete. Please add a profile photo and bio before applying.',
                    missingFields: {
                        profilePhoto: !user.profilePhotoUrl,
                        bio: !user.bio
                    }
                },
                { status: 400 }
            );
        }

        // Check if user has at least one video
        if (user.videos.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'You need to upload at least one video before applying to be a creator.'
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = creatorApplicationSchema.safeParse(body);
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

        const { contentCategory, biography, socialLinks, reasonToBeCreator } = validationResult.data;

        // Store application data
        // In a real app, you might create a separate CreatorApplication model
        // For simplicity, we'll store it as metadata and update the user
        const applicationData = {
            contentCategory,
            biographySubmitted: biography,
            socialLinks: socialLinks || {},
            reasonToBeCreator,
            appliedAt: new Date().toISOString(),
            status: 'pending' // pending, approved, rejected
        };

        // Update user with application data and creator category
        await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                creatorCategory: contentCategory,
                // Store application as JSON in a field - in production, use a separate table
                bio: JSON.stringify({
                    original: user.bio,
                    creatorApplication: applicationData
                })
            },
        });

        // In a production app, you would:
        // 1. Create a notification for admins to review
        // 2. Send an email confirmation to the user
        // 3. Store the application in a dedicated table

        return NextResponse.json(
            {
                success: true,
                message: 'Creator application submitted successfully. Our team will review your application shortly.',
                applicationData: {
                    contentCategory,
                    appliedAt: applicationData.appliedAt,
                    status: 'pending'
                }
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Creator application error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}