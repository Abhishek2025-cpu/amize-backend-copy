/**
 * @swagger
 * /settings/subscription:
 *   put:
 *     summary: Update creator subscription settings
 *     description: >
 *       Updates subscription settings for creators, such as subscription price
 *       and eligibility. Only accessible to users with CREATOR role or those
 *       who have been approved to become creators.
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
 *               creatorSubscriptionPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Base price for subscriptions (if custom pricing not enabled)
 *               minSubscriptionAmount:
 *                 type: number
 *                 minimum: 0
 *                 description: Minimum subscription amount when custom pricing is enabled
 *               maxSubscriptionAmount:
 *                 type: number
 *                 minimum: 0
 *                 description: Maximum subscription amount when custom pricing is enabled
 *     responses:
 *       200:
 *         description: Subscription settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a creator or not eligible to update subscription settings
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for subscription settings update
const subscriptionSettingsSchema = z.object({
    creatorSubscriptionPrice: z.number().nonnegative().optional(),
    minSubscriptionAmount: z.number().nonnegative().optional(),
    maxSubscriptionAmount: z.number().nonnegative().optional(),
}).refine(data => {
    // Ensure maxSubscriptionAmount is greater than or equal to minSubscriptionAmount if both are provided
    if (data.minSubscriptionAmount !== undefined && data.maxSubscriptionAmount !== undefined) {
        return data.maxSubscriptionAmount >= data.minSubscriptionAmount;
    }
    return true;
}, {
    message: "Maximum subscription amount must be greater than or equal to minimum subscription amount",
    path: ["maxSubscriptionAmount"],
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

        // Check if user is a creator or eligible to be a creator
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                id: true,
                role: true,
                isEligibleForCreator: true,
                creatorSubscriptionPrice: true,
                minSubscriptionAmount: true,
                maxSubscriptionAmount: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        if (user.role !== 'CREATOR' && !user.isEligibleForCreator) {
            return NextResponse.json(
                { success: false, message: 'You must be a creator or eligible for creator status to update subscription settings' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = subscriptionSettingsSchema.safeParse(body);
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

        // Update subscription settings
        const updatedUser = await prisma.user.update({
            where: { id: authUser.userId },
            data: validationResult.data,
            select: {
                id: true,
                creatorSubscriptionPrice: true,
                minSubscriptionAmount: true,
                maxSubscriptionAmount: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Subscription settings updated successfully',
                settings: {
                    creatorSubscriptionPrice: updatedUser.creatorSubscriptionPrice,
                    minSubscriptionAmount: updatedUser.minSubscriptionAmount,
                    maxSubscriptionAmount: updatedUser.maxSubscriptionAmount,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update subscription settings error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}