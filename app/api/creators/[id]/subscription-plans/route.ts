/**
 * @swagger
 * /creators/{id}/subscription-plans:
 *   get:
 *     summary: Get creator's subscription plans
 *     description: >
 *       Retrieves available subscription plans for a specific creator.
 *     tags:
 *       - Creators
 *       - Subscriptions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the creator
 *     responses:
 *       200:
 *         description: Creator subscription plans retrieved successfully
 *       404:
 *         description: Creator not found or not eligible for subscriptions
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const creatorId = params.id;

        // Verify the creator exists, is eligible, and get basic profile info
        const creator = await prisma.user.findUnique({
            where: {
                id: creatorId,
                isEligibleForCreator: true,
            },
            select: {
                id: true,
                username: true,
                profilePhotoUrl: true,
                creatorVerified: true,
                creatorCategory: true,
                monetizationEnabled: true,
                // Get creator subscription settings
                settings: {
                    select: {
                        creatorSubscriptionPrice: true,
                        minSubscriptionAmount: true,
                        maxSubscriptionAmount: true,
                    }
                }
            },
        });

        console.log("Creator : ", creator);

        if (!creator) {
            return NextResponse.json(
                { success: false, message: 'Creator not found or is not eligible for subscriptions' },
                { status: 404 }
            );
        }

        // Get active subscriber count
        const subscriberCount = await prisma.userSubscription.count({
            where: {
                creatorId: creatorId,
                status: 'active',
            },
        });

        // Get subscription plans for the creator - first try creator-specific plans
        let plans = await prisma.subscriptionPlan.findMany({
            where: {
                creatorId: creatorId,
            },
            orderBy: {
                price: 'asc',
            },
        });

        console.log("Subscriber count: ", subscriberCount);

        // If no creator-specific plans, get default platform plans
        if (plans.length === 0) {
            plans = await prisma.subscriptionPlan.findMany({
                where: {
                    isTemplate: true,
                    creatorId: null, // Global template plans
                },
                orderBy: {
                    price: 'asc',
                },
            });
        }

        // Format plan features from JSON string to array
        const formattedPlans = plans.map(plan => ({
            ...plan,
            features: plan.features ? JSON.parse(plan.features) : [],
        }));

        // Get authentication status to check if user is already subscribed
        const authUser = await getAuthUser(request);

        let userSubscription = null;
        if (authUser) {
            // Check if authenticated user is already subscribed to this creator
            userSubscription = await prisma.userSubscription.findFirst({
                where: {
                    subscriberId: authUser.userId,
                    creatorId: creatorId,
                    status: 'active',
                },
                select: {
                    id: true,
                    planId: true,
                    startDate: true,
                    endDate: true,
                    autoRenew: true,
                },
            });
        }

        // Get a few recent videos to showcase creator content
        const recentVideos = await prisma.video.findMany({
            where: {
                userId: creatorId,
                isPublic: true,
            },
            select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 3,
        });

        return NextResponse.json(
            {
                success: true,
                creator: {
                    id: creator.id,
                    username: creator.username,
                    profilePhotoUrl: creator.profilePhotoUrl,
                    verified: creator.creatorVerified,
                    category: creator.creatorCategory,
                    subscriberCount,
                    monetizationEnabled: creator.monetizationEnabled,
                },
                pricing: {
                    defaultPrice: creator.settings?.creatorSubscriptionPrice,
                    minPrice: creator.settings?.minSubscriptionAmount,
                    maxPrice: creator.settings?.maxSubscriptionAmount,
                },
                plans: formattedPlans,
                userSubscription,
                recentContent: recentVideos,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get creator subscription plans error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}