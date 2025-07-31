/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Create a new subscription
 *     description: >
 *       Creates a new subscription to a creator's plan. Handles initial payment processing.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - creatorId
 *               - planId
 *               - paymentMethodId
 *             properties:
 *               creatorId:
 *                 type: string
 *                 description: ID of the creator to subscribe to
 *               planId:
 *                 type: string
 *                 description: ID of the subscription plan
 *               paymentMethodId:
 *                 type: string
 *                 description: Payment method identifier from payment processor
 *               autoRenew:
 *                 type: boolean
 *                 description: Whether to automatically renew the subscription
 *                 default: true
 *     responses:
 *       201:
 *         description: Subscription created successfully
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Request body validation schema
const createSubscriptionSchema = z.object({
    creatorId: z.string().uuid({ message: "Invalid creator ID format" }),
    planId: z.string().uuid({ message: "Invalid plan ID format" }),
    paymentMethodId: z.string().min(3, { message: "Payment method is required" }),
    autoRenew: z.boolean().optional().default(true),
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
        const validationResult = createSubscriptionSchema.safeParse(body);
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

        const { creatorId, planId, paymentMethodId, autoRenew } = validationResult.data;

        // Check if creator exists and is eligible
        const creator = await prisma.user.findUnique({
            where: {
                id: creatorId,
                isEligibleForCreator: true,
                monetizationEnabled: true,
            },
            select: {
                id: true,
                username: true,
                profilePhotoUrl: true,
            },
        });

        if (!creator) {
            return NextResponse.json(
                { success: false, message: 'Creator not found or is not eligible for subscriptions' },
                { status: 404 }
            );
        }

        // Check if plan exists and belongs to creator or is a template
        const plan = await prisma.subscriptionPlan.findFirst({
            where: {
                id: planId,
                OR: [
                    { creatorId: creatorId },
                    { isTemplate: true, creatorId: null }
                ],
            },
        });

        if (!plan) {
            return NextResponse.json(
                { success: false, message: 'Subscription plan not found or not available for this creator' },
                { status: 404 }
            );
        }

        // Check if user is trying to subscribe to themselves
        if (authUser.userId === creatorId) {
            return NextResponse.json(
                { success: false, message: 'You cannot subscribe to yourself' },
                { status: 400 }
            );
        }

        // Check if user is already subscribed to this creator
        const existingSubscription = await prisma.userSubscription.findFirst({
            where: {
                subscriberId: authUser.userId,
                creatorId: creatorId,
                status: 'active',
            },
        });

        if (existingSubscription) {
            return NextResponse.json(
                { success: false, message: 'You are already subscribed to this creator' },
                { status: 400 }
            );
        }

        // In a real application, this is where you would integrate with a payment processor
        // For example, you might use Stripe to process the initial payment

        // For this demo, we'll simulate a successful payment process
        const transactionId = `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Calculate subscription end date based on plan interval
        const startDate = new Date();
        let endDate = new Date(startDate);

        if (plan.intervalType === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan.intervalType === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Create the subscription and initial payment in a transaction
        const result = await prisma.$transaction(async (prisma) => {
            // Create the subscription
            const subscription = await prisma.userSubscription.create({
                data: {
                    subscriberId: authUser.userId,
                    creatorId: creatorId,
                    planId: planId,
                    status: 'active',
                    startDate: startDate,
                    endDate: endDate,
                    autoRenew: autoRenew,
                    lastPaymentDate: startDate,
                    nextPaymentDate: endDate,
                    paymentMethod: paymentMethodId,
                },
            });

            // Create the initial payment record
            const payment = await prisma.subscriptionPayment.create({
                data: {
                    userSubscriptionId: subscription.id,
                    amount: plan.price,
                    currency: plan.currency,
                    status: 'successful',
                    paymentMethod: paymentMethodId,
                    transactionId: transactionId,
                },
            });

            return { subscription, payment };
        });

        // In a real application, you would:
        // 1. Send a confirmation email to the subscriber
        // 2. Send a notification to the creator
        // 3. Potentially trigger webhooks for external integrations

        return NextResponse.json(
            {
                success: true,
                message: `You have successfully subscribed to ${creator.username}`,
                subscription: {
                    id: result.subscription.id,
                    plan: {
                        id: plan.id,
                        name: plan.name,
                        price: plan.price,
                        currency: plan.currency,
                        intervalType: plan.intervalType,
                    },
                    creator: {
                        id: creator.id,
                        username: creator.username,
                    },
                    startDate: result.subscription.startDate,
                    endDate: result.subscription.endDate,
                    status: 'active',
                    autoRenew: result.subscription.autoRenew,
                },
                payment: {
                    id: result.payment.id,
                    amount: result.payment.amount,
                    currency: result.payment.currency,
                    status: result.payment.status,
                    transactionId: result.payment.transactionId,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create subscription error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * @swagger
 * /subscriptions/{id}/cancel:
 *   patch:
 *     summary: Cancel a subscription
 *     description: >
 *       Cancels an active subscription. The subscription will remain active until the end
 *       of the current billing period, but will not auto-renew.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the subscription to cancel
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
 */
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const subscriptionId = params.id;

        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the subscription
        const subscription = await prisma.userSubscription.findUnique({
            where: { id: subscriptionId },
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

        // Check authorization - can only cancel own subscriptions
        if (authUser.userId !== subscription.subscriberId) {
            const isAdmin = (await prisma.user.findUnique({
                where: { id: authUser.userId },
                select: { role: true },
            }))?.role === 'ADMIN';

            if (!isAdmin) {
                return NextResponse.json(
                    { success: false, message: 'You are not authorized to cancel this subscription' },
                    { status: 403 }
                );
            }
        }

        // Check if subscription is already canceled
        if (subscription.status === 'canceled') {
            return NextResponse.json(
                { success: false, message: 'Subscription is already canceled' },
                { status: 400 }
            );
        }

        // In a real application, you might integrate with a payment processor
        // to cancel the subscription at the payment provider level

        // Update the subscription - keep active until end date, but disable auto-renewal
        const updatedSubscription = await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: {
                autoRenew: false,
                // Don't change status to 'canceled' yet, as it's still valid until the end date
                // In a background job, you'd update statuses of expired subscriptions
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Subscription canceled successfully',
                subscription: {
                    id: updatedSubscription.id,
                    endDate: updatedSubscription.endDate,
                    autoRenew: updatedSubscription.autoRenew,
                    message: 'Your subscription will remain active until the end date, then will not renew',
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}