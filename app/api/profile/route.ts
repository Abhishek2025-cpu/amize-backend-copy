/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     description: >
 *       Retrieves the profile details of the authenticated user including name, bio, and profile photo.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     profilePhotoUrl:
 *                       type: string
 *                     gender:
 *                       type: string
 *                     dateOfBirth:
 *                       type: string
 *                       format: date-time
 *                     verified:
 *                       type: boolean
 *                     creatorVerified:
 *                       type: boolean
 *                     creatorCategory:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update user profile
 *     description: >
 *       Updates profile information for the authenticated user.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name
 *               lastName:
 *                 type: string
 *                 description: Last name
 *               username:
 *                 type: string
 *                 description: Username (must be unique)
 *               bio:
 *                 type: string
 *                 description: Short bio or description
 *               gender:
 *                 type: string
 *                 description: Gender identity
 *               dateOfBirth:
 *                 type: string
 *                 format: date-time
 *                 description: Date of birth
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for profile update
const profileUpdateSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
    lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
    username: z.string().regex(/^[a-zA-Z0-9_.]{3,30}$/,
        "Username can only contain letters, numbers, underscores, and periods, and must be 3-30 characters long").optional(),
    bio: z.string().max(160, "Bio cannot exceed 160 characters").optional(),
    gender: z.string().optional(),
    dateOfBirth: z.string().optional().transform(val => val ? new Date(val) : undefined)
        .refine(val => !val || !isNaN(val.getTime()), {
            message: "Invalid date format",
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

        // Get user profile data
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                fullName: true,
                bio: true,
                profilePhotoUrl: true,
                gender: true,
                dateOfBirth: true,
                verified: true,
                creatorVerified: true,
                creatorCategory: true,
                role: true,
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
                profile: user,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get profile error:', error);
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
        const validationResult = profileUpdateSchema.safeParse(body);
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

        const { username, firstName, lastName, ...otherData } = validationResult.data;

        // If username is being updated, check if it's already taken
        if (username) {
            const existingUser = await prisma.user.findUnique({
                where: {
                    username,
                    NOT: {
                        id: authUser.userId
                    }
                }
            });

            if (existingUser) {
                return NextResponse.json(
                    { success: false, message: 'Username already exists' },
                    { status: 409 }
                );
            }
        }

        // Prepare update data
        const updateData: any = {
            ...otherData
        };

        if (username) updateData.username = username;
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;

        // Update fullName if both first and last name are provided or one is changing
        if (firstName || lastName) {
            // Get current values if not provided
            const currentUser = await prisma.user.findUnique({
                where: { id: authUser.userId },
                select: {
                    firstName: true,
                    lastName: true
                }
            });

            if (currentUser) {
                const newFirstName = firstName || currentUser.firstName;
                const newLastName = lastName || currentUser.lastName;
                updateData.fullName = `${newFirstName} ${newLastName}`;
            }
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: authUser.userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                fullName: true,
                bio: true,
                profilePhotoUrl: true,
                gender: true,
                dateOfBirth: true,
                verified: true,
                creatorVerified: true,
                creatorCategory: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Profile updated successfully',
                profile: updatedUser,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}