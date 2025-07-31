/**
 * @swagger
 * /subscription-payments/{id}:
 *   get:
 *     summary: Check payment status
 *     description: >
 *       Retrieves the status and details of a specific subscription payment.
 *       Users can only view their own payments, while creators can view payments made to them.
 *     tags:
 *       - Subscriptions
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment to check
 *     responses:
 *       200:
 *         description: Payment details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot view other user's payment
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const paymentId = params.id;

        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the payment with subscription details
        const payment = await prisma.subscriptionPayment.findUnique({
            where: { id: paymentId },
            include: {
                userSubscription: {
                    include: {
                        subscriber: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                        creator: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                        plan: true,
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json(
                { success: false, message: 'Payment not found' },
                { status: 404 }
            );
        }

        // Check authorization
        // Users can view their own payments or payments made to them as creators
        const isAdmin = (await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: { role: true },
        }))?.role === 'ADMIN';

        const isSubscriber = payment.userSubscription.subscriberId === authUser.userId;
        const isCreator = payment.userSubscription.creatorId === authUser.userId;

        if (!isSubscriber && !isCreator && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'You are not authorized to view this payment' },
                { status: 403 }
            );
        }

        // In a real application, you might want to check with the payment processor
        // to get the most up-to-date status of the payment
        // This is especially important for payment statuses that can change over time

        return NextResponse.json(
            {
                success: true,
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    paymentMethod: payment.paymentMethod,
                    transactionId: payment.transactionId,
                    createdAt: payment.createdAt,
                },
                subscription: {
                    id: payment.userSubscription.id,
                    subscriber: payment.userSubscription.subscriber,
                    creator: payment.userSubscription.creator,
                    plan: {
                        id: payment.userSubscription.plan.id,
                        name: payment.userSubscription.plan.name,
                        price: payment.userSubscription.plan.price,
                        currency: payment.userSubscription.plan.currency,
                        intervalType: payment.userSubscription.plan.intervalType,
                    },
                    startDate: payment.userSubscription.startDate,
                    endDate: payment.userSubscription.endDate,
                    status: payment.userSubscription.status,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get payment status error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}