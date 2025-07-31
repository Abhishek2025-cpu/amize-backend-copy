/**
 * @swagger
 * /users/{id}/subscriptions:
 *   get:
 *     summary: Get user's subscriptions
 *     description: >
 *       Retrieves active subscriptions for a specific user. Users can view their own
 *       subscriptions, while admins can view any user's subscriptions.
 *     tags:
 *       - Subscriptions
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, canceled, expired, all]
 *         description: Filter subscriptions by status (default is active)
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [subscribing, subscribers]
 *         description: View subscriptions to creators or subscribers to this creator (if eligible)
 *     responses:
 *       200:
 *         description: List of subscriptions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot access other user's subscriptions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Query parameters validation schema
const getSubscriptionsQuerySchema = z.object({
    status: z.enum(['active', 'canceled', 'expired', 'all']).optional().default('active'),
    mode: z.enum(['subscribing', 'subscribers']).optional().default('subscribing'),
});

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const userId = params.id;

        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify the user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                role: true,
                isEligibleForCreator: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Check authorization
        // Users can only view their own subscriptions, unless they're admins
        const isAdmin = (await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: { role: true },
        }))?.role === 'ADMIN';

        if (authUser.userId !== userId && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'You are not authorized to view these subscriptions' },
                { status: 403 }
            );
        }

        // Parse query parameters
        const url = new URL(request.url);
        const validationResult = getSubscriptionsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

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

        const { status, mode } = validationResult.data;

        // Build query filter based on selected mode
        let subscriptions = [];
        let whereCondition: any = {};

        if (mode === 'subscribing') {
            // User's subscriptions to creators
            whereCondition.subscriberId = userId;

            // Filter by status if not 'all'
            if (status !== 'all') {
                whereCondition.status = status;
            }

            subscriptions = await prisma.userSubscription.findMany({
                where: whereCondition,
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            profilePhotoUrl: true,
                            fullName: true,
                            creatorVerified: true,
                            creatorCategory: true,
                        },
                    },
                    plan: true,
                    SubscriptionPayment: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1,
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        } else {
            // Subscribers to this creator (only if user is a creator)
            if (!user.isEligibleForCreator) {
                return NextResponse.json(
                    { success: false, message: 'User is not a creator and has no subscribers' },
                    { status: 403 }
                );
            }

            whereCondition.creatorId = userId;

            // Filter by status if not 'all'
            if (status !== 'all') {
                whereCondition.status = status;
            }

            subscriptions = await prisma.userSubscription.findMany({
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
                    plan: true,
                    SubscriptionPayment: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1,
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        }

        // Calculate statistics
        const totalSubscriptions = subscriptions.length;
        const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;

        // Calculate total revenue/spend (current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const currentMonthPayments = subscriptions.flatMap(sub =>
            sub.SubscriptionPayment.filter(payment => {
                const paymentDate = new Date(payment.createdAt);
                return paymentDate.getMonth() === currentMonth &&
                    paymentDate.getFullYear() === currentYear &&
                    payment.status === 'successful';
            })
        );

        const totalAmount = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

        return NextResponse.json(
            {
                success: true,
                subscriptions: subscriptions.map(sub => ({
                    ...sub,
                    // Remove sensitive payment details
                    SubscriptionPayment: sub.SubscriptionPayment.map(payment => ({
                        id: payment.id,
                        amount: payment.amount,
                        currency: payment.currency,
                        status: payment.status,
                        createdAt: payment.createdAt,
                    })),
                })),
                stats: {
                    total: totalSubscriptions,
                    active: activeSubscriptions,
                    [mode === 'subscribing' ? 'spending' : 'revenue']: totalAmount,
                    currency: currentMonthPayments.length > 0 ? currentMonthPayments[0].currency : 'USD',
                    period: `${currentMonth + 1}/${currentYear}`,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get user subscriptions error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}