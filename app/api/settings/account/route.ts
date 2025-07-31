/**
 * @swagger
 * /settings/account:
 *   get:
 *     summary: Get account settings
 *     description: >
 *       Retrieves the account settings and preferences for the authenticated user.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's account settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 settings:
 *                   type: object
 *                   properties:
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
 *                     useFingerprint:
 *                       type: boolean
 *                     useFaceId:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update account settings
 *     description: >
 *       Updates the account settings and preferences for the authenticated user.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether the account is private
 *               isBusinessAccount:
 *                 type: boolean
 *                 description: Whether the account is a business account
 *               language:
 *                 type: string
 *                 description: Preferred language
 *               instagramHandle:
 *                 type: string
 *                 description: Instagram handle (without @)
 *               facebookHandle:
 *                 type: string
 *                 description: Facebook handle
 *               twitterHandle:
 *                 type: string
 *                 description: Twitter handle (without @)
 *               useFingerprint:
 *                 type: boolean
 *                 description: Whether to use fingerprint authentication
 *               useFaceId:
 *                 type: boolean
 *                 description: Whether to use Face ID authentication
 *     responses:
 *       200:
 *         description: Account settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for account settings update
const accountSettingsSchema = z.object({
    isPrivate: z.boolean().optional(),
    isBusinessAccount: z.boolean().optional(),
    language: z.string().min(2).max(50).optional(),
    instagramHandle: z.string().max(30).optional().nullable(),
    facebookHandle: z.string().max(50).optional().nullable(),
    twitterHandle: z.string().max(30).optional().nullable(),
    useFingerprint: z.boolean().optional(),
    useFaceId: z.boolean().optional(),
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

        // Get user's account settings
        // const user = await prisma.user.findUnique({
        //     where: { id: authUser.userId },
        //     select: {
        //         id: true,
        //         isPrivate: true,
        //         isBusinessAccount: true,
        //         language: true,
        //         instagramHandle: true,
        //         facebookHandle: true,
        //         twitterHandle: true,
        //         useFingerprint: true,
        //         useFaceId: true,
        //     },
        // });
        //
        // if (!user) {
        //     return NextResponse.json(
        //         { success: false, message: 'User not found' },
        //         { status: 404 }
        //     );
        // }

        // return NextResponse.json(
        //     {
        //         success: true,
        //         settings: {
        //             isPrivate: user.isPrivate,
        //             isBusinessAccount: user.isBusinessAccount,
        //             language: user.language,
        //             instagramHandle: user.instagramHandle,
        //             facebookHandle: user.facebookHandle,
        //             twitterHandle: user.twitterHandle,
        //             useFingerprint: user.useFingerprint,
        //             useFaceId: user.useFaceId,
        //         },
        //     },
        //     { status: 200 }
        // );
    } catch (error: any) {
        console.error('Get account settings error:', error);
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
        const validationResult = accountSettingsSchema.safeParse(body);
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

        // // Update account settings
        // const updatedUser = await prisma.user.update({
        //     where: { id: authUser.userId },
        //     data: validationResult.data,
        //     select: {
        //         id: true,
        //         isPrivate: true,
        //         isBusinessAccount: true,
        //         language: true,
        //         instagramHandle: true,
        //         facebookHandle: true,
        //         twitterHandle: true,
        //         useFingerprint: true,
        //         useFaceId: true,
        //     },
        // });
        //
        // return NextResponse.json(
        //     {
        //         success: true,
        //         message: 'Account settings updated successfully',
        //         settings: {
        //             isPrivate: updatedUser.isPrivate,
        //             isBusinessAccount: updatedUser.isBusinessAccount,
        //             language: updatedUser.language,
        //             instagramHandle: updatedUser.instagramHandle,
        //             facebookHandle: updatedUser.facebookHandle,
        //             twitterHandle: updatedUser.twitterHandle,
        //             useFingerprint: updatedUser.useFingerprint,
        //             useFaceId: updatedUser.useFaceId,
        //         },
        //     },
        //     { status: 200 }
        // );
    } catch (error: any) {
        console.error('Update account settings error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}