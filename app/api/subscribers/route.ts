/**
 * @swagger
 * /subscribers:
 *   get:
 *     summary: List creator's subscribers
 *     description: >
 *       Retrieves a list of users who have subscribed to the authenticated creator.
 *       Only accessible to users with CREATOR role who are eligible for subscriptions.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, canceled, expired, all]
 *         description: Filter subscriptions by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of creator's subscribers
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Query parameters validation schema
const getSubscribersQuerySchema = z.object({
    status: z.enum(['active', 'canceled', 'expired', 'all']).optional().default('active'),
    page: z.coerce.number().positive().optional().default(1),
    limit: z.coerce.number().positive().max(100).optional().default(10),
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

        // Verify user is an eligible creator
        const creator = await prisma.user.findUnique({
            where: {
                id: authUser.userId,
                isEligibleForCreator: true,
            },
        });

        if (!creator) {
            return NextResponse.json(
                { success: false, message: 'You must be an eligible creator to access this resource' },
                { status: 403 }
            );
        }

        // Parse and validate query parameters
        const url = new URL(request.url);
        const validationResult = getSubscribersQuerySchema.safeParse(Object.fromEntries(url.searchParams));

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid query parameters',
                    errors: validationResult.error.errors
                },
                { status: 400 }
            );
        }

        const { status, page, limit } = validationResult.data;

        // Calculate pagination offsets
        const skip = (page - 1) * limit;

        // Build filter conditions
        const whereCondition: any = {
            creatorId: authUser.userId,
        };

        if (status !== 'all') {
            whereCondition.status = status;
        }

        // Count total matching subscribers for pagination
        const totalSubscribers = await prisma.userSubscription.count({
            where: whereCondition,
        });

        // Get subscribers with subscription details
        const subscribers = await prisma.userSubscription.findMany({
            where: whereCondition,
            include: {
                subscriber: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                        fullName: true,
                    },
                },
                plan: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        currency: true,
                        intervalType: true,
                    },
                },
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalSubscribers / limit);

        // Calculate total revenue from active subscriptions
        const activeSubscriptions = subscribers.filter(sub => sub.status === 'active');
        const totalActiveSubscribers = activeSubscriptions.length;
        const totalMonthlyRevenue = activeSubscriptions.reduce((sum, sub) => sum + sub.plan.price, 0);

        return NextResponse.json(
            {
                success: true,
                subscribers,
                stats: {
                    totalActiveSubscribers,
                    totalMonthlyRevenue,
                },
                pagination: {
                    total: totalSubscribers,
                    pages: totalPages,
                    page,
                    limit,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get subscribers error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}