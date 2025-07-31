/**
 * @swagger
 * /subscription-payments:
 *   post:
 *     summary: Process a subscription payment
 *     description: >
 *       Processes a new payment for a subscription. Can be used for initial payments,
 *       manual renewals, or handling failed payments.
 *     tags:
 *       - Subscriptions
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userSubscriptionId
 *               - paymentMethodId
 *             properties:
 *               userSubscriptionId:
 *                 type: string
 *                 description: ID of the subscription to process payment for
 *               paymentMethodId:
 *                 type: string
 *                 description: Payment method identifier from payment processor
 *               amount:
 *                 type: number
 *                 description: Optional payment amount (defaults to plan price)
 *     responses:
 *       201:
 *         description: Payment processed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot process payment for other user's subscription
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for payment processing
const processPaymentSchema = z.object({
    userSubscriptionId: z.string().uuid({ message: "Invalid subscription ID format" }),
    paymentMethodId: z.string().min(3, { message: "Payment method is required" }),
    amount: z.number().positive().optional(),
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

        const body = await request.json();

        // Validate request body
        const validationResult = processPaymentSchema.safeParse(body);
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

        const { userSubscriptionId, paymentMethodId, amount } = validationResult.data;

        // Check if subscription exists and belongs to the user
        const subscription = await prisma.userSubscription.findUnique({
            where: { id: userSubscriptionId },
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
        });

        if (!subscription) {
            return NextResponse.json(
                { success: false, message: 'Subscription not found' },
                { status: 404 }
            );
        }

        // Check authorization - can only process payment for own subscriptions
        // (in a real system, this might be done by a background job as well)
        const isAdmin = (await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: { role: true },
        }))?.role === 'ADMIN';

        if (authUser.userId !== subscription.subscriberId && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'You are not authorized to process payment for this subscription' },
                { status: 403 }
            );
        }

        // Determine payment amount (use provided amount or plan price)
        const paymentAmount = amount || subscription.plan.price;

        // In a real application, this is where you would integrate with a payment processor
        // For example, you might use Stripe to create a payment intent and process the payment

        // For this example, we'll simulate a successful payment

        // Create a transaction ID for the payment
        const transactionId = `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Process the payment
        // In a real application, you would handle payment success/failure based on the payment processor response
        const paymentStatus = 'successful'; // For this example, assume success

        // Create the payment record
        const payment = await prisma.subscriptionPayment.create({
            data: {
                userSubscriptionId,
                amount: paymentAmount,
                currency: subscription.plan.currency,
                status: paymentStatus,
                paymentMethod: paymentMethodId,
                transactionId,
            },
        });

        // If payment was successful, update the subscription
        if (paymentStatus === 'successful') {
            // Calculate new end date
            const now = new Date();
            let newEndDate = new Date(now);

            if (subscription.plan.intervalType === 'monthly') {
                newEndDate.setMonth(newEndDate.getMonth() + 1);
            } else if (subscription.plan.intervalType === 'yearly') {
                newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            }

            // Update subscription with new payment dates and ensure it's active
            await prisma.userSubscription.update({
                where: { id: userSubscriptionId },
                data: {
                    status: 'active',
                    lastPaymentDate: now,
                    nextPaymentDate: newEndDate,
                    endDate: newEndDate,
                    paymentMethod: paymentMethodId,
                },
            });
        }

        // In a real application, you would handle payment failure scenarios
        // including retries, notifications, etc.

        return NextResponse.json(
            {
                success: true,
                message: 'Payment processed successfully',
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    transactionId: payment.transactionId,
                    createdAt: payment.createdAt,
                },
                subscription: {
                    id: subscription.id,
                    plan: subscription.plan.name,
                    creator: subscription.creator.username,
                    nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                    status: 'active',
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Process payment error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}