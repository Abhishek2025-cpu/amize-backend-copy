/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get user profile
 *     description: >
 *       Retrieves the profile details of the authenticated user.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     address:
 *                       type: string
 *                     gender:
 *                       type: string
 *                     profilePhotoUrl:
 *                       type: string
 *                     role:
 *                       type: string
 *                     verified:
 *                       type: boolean
 *                     creatorVerified:
 *                       type: boolean
 *                     creatorCategory:
 *                       type: string
 *                     monetizationEnabled:
 *                       type: boolean
 *                     isPrivate:
 *                       type: boolean
 *                     isBusinessAccount:
 *                       type: boolean
 *                     language:
 *                       type: string
 *                     instagramHandle:
 *                       type: string
 *                     facebookHandle:
 *                       type: string
 *                     twitterHandle:
 *                       type: string
 *                     interests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *       401:
 *         description: Unauthorized access
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
 *                   example: Unauthorized
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
 *   put:
 *     summary: Update user profile
 *     description: >
 *       Updates the profile details of the authenticated user.
 *     tags:
 *       - Authentication
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
 *                 minLength: 2
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *               bio:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               gender:
 *                 type: string
 *               profilePhotoUrl:
 *                 type: string
 *                 format: url
 *               language:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *               isBusinessAccount:
 *                 type: boolean
 *               instagramHandle:
 *                 type: string
 *               facebookHandle:
 *                 type: string
 *               twitterHandle:
 *                 type: string
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Successful profile update
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
 *                   example: Profile updated successfully
 *                 user:
 *                   type: object
 *                   description: Updated user details
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
 *         description: Unauthorized access
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
 *                   example: Unauthorized
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
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Update profile validation schema
const updateProfileSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    bio: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional(),
    profilePhotoUrl: z.string().url().optional().nullable(),
    language: z.string().optional(),
    isPrivate: z.boolean().optional(),
    isBusinessAccount: z.boolean().optional(),
    instagramHandle: z.string().optional(),
    facebookHandle: z.string().optional(),
    twitterHandle: z.string().optional(),
    interests: z.array(z.string()).optional(),
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

        // Fetch user details
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
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
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Remove sensitive data
        const { passwordHash, ...userWithoutPassword } = user;

        return NextResponse.json(
            { success: true, user: userWithoutPassword },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get user profile error:', error);
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
        const validationResult = updateProfileSchema.safeParse(body);
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

        const updateData = validationResult.data;
        const { interests, ...userData } = updateData;

        // Begin transaction
        const updatedUser = await prisma.$transaction(async (tx) => {
            // Update user profile
            const user = await tx.user.update({
                where: { id: authUser.userId },
                data: {
                    ...userData,
                    // If both first and last name are provided, update fullName
                    ...(updateData.firstName && updateData.lastName
                        ? { fullName: `${updateData.firstName} ${updateData.lastName}` }
                        : {}),
                },
                include: {
                    interests: true,
                },
            });

            // Update interests if provided
            if (interests && interests.length > 0) {
                // First remove all existing interests
                await tx.user.update({
                    where: { id: authUser.userId },
                    data: {
                        interests: {
                            disconnect: user.interests.map(interest => ({ id: interest.id })),
                        },
                    },
                });

                // Connect new interests - first ensure they exist
                for (const interestName of interests) {
                    await tx.interest.upsert({
                        where: { name: interestName },
                        update: {},
                        create: { name: interestName },
                    });
                }

                // Connect interests to user
                await tx.user.update({
                    where: { id: authUser.userId },
                    data: {
                        interests: {
                            connect: interests.map(name => ({ name })),
                        },
                    },
                });
            }

            // Get the final user with updated interests
            return tx.user.findUnique({
                where: { id: authUser.userId },
                include: {
                    interests: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
        });

        // Remove sensitive data
        if (updatedUser) {
            const { passwordHash, ...userWithoutPassword } = updatedUser;

            return NextResponse.json(
                {
                    success: true,
                    message: 'Profile updated successfully',
                    user: userWithoutPassword
                },
                { status: 200 }
            );
        } else {
            throw new Error('Failed to update user profile');
        }
    } catch (error: any) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}