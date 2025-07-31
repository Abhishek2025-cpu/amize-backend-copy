/**
 * @swagger
 * /users/{id}/creator-status:
 *   get:
 *     summary: Check creator status
 *     description: >
 *       Retrieves the creator status of a specific user, including eligibility,
 *       verification, and monetization capabilities.
 *     tags:
 *       - Creators
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to check creator status
 *     responses:
 *       200:
 *         description: Creator status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 creator:
 *                   type: object
 *                   properties:
 *                     isCreator:
 *                       type: boolean
 *                     isEligibleForCreator:
 *                       type: boolean
 *                     creatorVerified:
 *                       type: boolean
 *                     monetizationEnabled:
 *                       type: boolean
 *                     creatorCategory:
 *                       type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         subscribers:
 *                           type: integer
 *                         totalContent:
 *                           type: integer
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const userId = params.id;
        console.log(`Checking creator status for user ${userId}`);

        // Get the user and verify they exist
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                role: true,
                isEligibleForCreator: true,
                creatorVerified: true,
                monetizationEnabled: true,
                creatorCategory: true,
                // Count of videos
                _count: {
                    select: {
                        videos: true,
                    },
                },
            },
        });

        console.log("User found:", user);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Count subscribers
        const subscriberCount = await prisma.userSubscription.count({
            where: {
                creatorId: userId,
                status: 'active',
            },
        });

        // Check if authenticated user is viewing their own creator status
        const authUser = await getAuthUser(request);
        const isOwnProfile = authUser && authUser.userId === userId;

        // Check if authenticated user is an admin
        let isAdmin = false;
        if (authUser) {
            const adminCheck = await prisma.user.findUnique({
                where: { id: authUser.userId },
                select: { role: true },
            });
            isAdmin = adminCheck?.role === 'ADMIN';
        }

        // Prepare the response - using role to determine if user is a creator
        const creatorStatus = {
            isCreator: user.role === 'CREATOR', // Correctly map from role
            isEligibleForCreator: user.isEligibleForCreator,
            creatorVerified: user.creatorVerified,
            monetizationEnabled: user.monetizationEnabled,
            creatorCategory: user.creatorCategory,
            stats: {
                subscribers: subscriberCount,
                totalContent: user._count.videos,
            },
        };

        // If it's the user's own profile or an admin, include more details
        if (isOwnProfile || isAdmin) {
            // Get subscription plans for this creator
            const creatorPlans = await prisma.subscriptionPlan.findMany({
                where: {
                    creatorId: userId,
                },
                orderBy: {
                    price: 'asc',
                },
            });

            // If no creator-specific plans, get template plans
            const templatePlans = creatorPlans.length === 0 ?
                await prisma.subscriptionPlan.findMany({
                    where: {
                        isTemplate: true,
                        creatorId: null,
                    },
                    orderBy: {
                        price: 'asc',
                    },
                }) : [];

            const plans = creatorPlans.length > 0 ? creatorPlans : templatePlans;

            // Format the plans
            const formattedPlans = plans.map(plan => ({
                ...plan,
                features: plan.features ? JSON.parse(plan.features) : [],
            }));

            console.log(`Found ${formattedPlans.length} subscription plans`);

            // Include additional information for owner/admin view
            return NextResponse.json(
                {
                    success: true,
                    creator: {
                        ...creatorStatus,
                        subscriptionPlans: formattedPlans,
                        applicationStatus: user.isEligibleForCreator ? 'approved' : 'pending',
                        adminView: isAdmin,
                    },
                },
                { status: 200 }
            );
        }

        // Regular public view
        return NextResponse.json(
            {
                success: true,
                creator: creatorStatus,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get creator status error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}