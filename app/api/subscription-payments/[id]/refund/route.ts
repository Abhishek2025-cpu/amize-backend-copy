/**
 * @swagger
 * /subscription-payments/{id}/refund:
 *   post:
 *     summary: Refund a subscription payment
 *     description: >
 *       Processes a refund for a subscription payment.
 *       Only admins and the creator who received the payment can issue refunds.
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
 *         description: ID of the payment to refund
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for the refund
 *               amount:
 *                 type: number
 *                 description: Optional amount to refund (for partial refunds)
 *               cancelSubscription:
 *                 type: boolean
 *                 description: Whether to cancel the subscription after refund
 *                 default: false
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Validation error or payment already refunded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot refund other creator's payment
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for refund processing
const refundSchema = z.object({
    reason: z.string().min(3, { message: "Reason is required" }),
    amount: z.number().positive().optional(),
    cancelSubscription: z.boolean().default(false),
});

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
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
                                email: true,
                            },
                        },
                        creator: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
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

        // Check if payment is already refunded
        if (payment.status === 'refunded') {
            return NextResponse.json(
                { success: false, message: 'Payment has already been refunded' },
                { status: 400 }
            );
        }

        // Check authorization
        // Only admin or the creator who received the payment can issue a refund
        const isAdmin = (await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: { role: true },
        }))?.role === 'ADMIN';

        const isCreator = payment.userSubscription.creatorId === authUser.userId;

        if (!isCreator && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'You are not authorized to refund this payment' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = refundSchema.safeParse(body);
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

        const { reason, amount, cancelSubscription } = validationResult.data;

        // Determine refund amount
        const refundAmount = amount || payment.amount;

        // Validate refund amount doesn't exceed original payment
        if (refundAmount > payment.amount) {
            return NextResponse.json(
                { success: false, message: 'Refund amount cannot exceed the original payment amount' },
                { status: 400 }
            );
        }

        // In a real application, this is where you would integrate with a payment processor
        // to issue the actual refund using the stored transaction ID

        // For example, with Stripe:
        // const refund = await stripe.refunds.create({
        //   payment_intent: payment.transactionId,
        //   amount: Math.floor(refundAmount * 100), // Stripe uses cents
        //   reason: 'requested_by_customer',
        // });

        // For this example, we'll simulate a successful refund
        const refundTransactionId = `ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Create a transaction to handle the refund and subscription state
        const result = await prisma.$transaction(async (prisma) => {
            // Update the payment status
            const updatedPayment = await prisma.subscriptionPayment.update({
                where: { id: paymentId },
                data: {
                    status: 'refunded',
                },
            });

            // If requested, cancel the subscription
            let subscriptionUpdate = null;
            if (cancelSubscription) {
                subscriptionUpdate = await prisma.userSubscription.update({
                    where: { id: payment.userSubscriptionId },
                    data: {
                        status: 'canceled',
                        autoRenew: false,
                    },
                });
            }

            // Create a record of the refund with metadata
            // In a real app, you might have a separate Refund model
            // For this example, we'll create a new payment record with negative amount
            const refundRecord = await prisma.subscriptionPayment.create({
                data: {
                    userSubscriptionId: payment.userSubscriptionId,
                    amount: -refundAmount, // Negative amount to indicate refund
                    currency: payment.currency,
                    status: 'successful',
                    paymentMethod: payment.paymentMethod,
                    transactionId: refundTransactionId,
                },
            });

            return {
                payment: updatedPayment,
                refund: refundRecord,
                subscriptionUpdate,
            };
        });

        // In a real application, you would send notifications to both parties
        // - Notify subscriber of the refund
        // - Notify creator of the revenue reduction

        return NextResponse.json(
            {
                success: true,
                message: 'Refund processed successfully',
                refund: {
                    id: result.refund.id,
                    amount: refundAmount,
                    currency: payment.currency,
                    originalPaymentId: paymentId,
                    transactionId: refundTransactionId,
                    reason,
                    createdAt: result.refund.createdAt,
                },
                subscription: cancelSubscription ? {
                    id: payment.userSubscriptionId,
                    status: 'canceled',
                    message: 'Subscription has been canceled due to refund',
                } : {
                    id: payment.userSubscriptionId,
                    status: payment.userSubscription.status,
                    message: 'Subscription remains active',
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Process refund error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}