/**
 * @swagger
 * /subscriptions/{id}:
 *   patch:
 *     summary: Update subscription status
 *     description: >
 *       Updates a subscription's status (cancel, renew) and settings.
 *       Users can update their own subscriptions, while admins can update any subscription.
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
 *         description: ID of the subscription to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, canceled]
 *                 description: New status for the subscription
 *               autoRenew:
 *                 type: boolean
 *                 description: Whether to automatically renew the subscription
 *               planId:
 *                 type: string
 *                 description: ID of a new plan to upgrade/downgrade to
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - cannot modify other user's subscription
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for subscription update
const updateSubscriptionSchema = z.object({
    status: z.enum(['active', 'canceled']).optional(),
    autoRenew: z.boolean().optional(),
    planId: z.string().uuid({ message: "Invalid plan ID format" }).optional(),
});

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

        // Check if subscription exists
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

        // Check authorization
        // Users can only update their own subscriptions, admins can update any
        const isAdmin = (await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: { role: true },
        }))?.role === 'ADMIN';

        if (authUser.userId !== subscription.subscriberId && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'You are not authorized to update this subscription' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = updateSubscriptionSchema.safeParse(body);
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

        const { status, autoRenew, planId } = validationResult.data;

        // Prepare update data
        const updateData: any = {};
        const changes: string[] = [];

        // Handle status change
        if (status !== undefined) {
            // If changing from active to canceled
            if (subscription.status === 'active' && status === 'canceled') {
                updateData.status = 'canceled';
                updateData.autoRenew = false;
                changes.push('Subscription canceled');
            }
            // If reactivating a canceled subscription (if not expired)
            else if (subscription.status === 'canceled' && status === 'active') {
                const now = new Date();
                if (subscription.endDate && new Date(subscription.endDate) > now) {
                    updateData.status = 'active';
                    changes.push('Subscription reactivated');
                } else {
                    // Cannot reactivate an expired subscription - require a new subscription
                    return NextResponse.json(
                        { success: false, message: 'This subscription has expired. Please create a new subscription.' },
                        { status: 400 }
                    );
                }
            }
        }

        // Handle auto-renew setting
        if (autoRenew !== undefined) {
            updateData.autoRenew = autoRenew;
            changes.push(`Auto-renew ${autoRenew ? 'enabled' : 'disabled'}`);
        }

        // Handle plan change (upgrade/downgrade)
        if (planId !== undefined && planId !== subscription.planId) {
            // Verify the new plan exists
            const newPlan = await prisma.subscriptionPlan.findUnique({
                where: { id: planId },
            });

            if (!newPlan) {
                return NextResponse.json(
                    { success: false, message: 'Subscription plan not found' },
                    { status: 404 }
                );
            }

            updateData.planId = planId;

            // Determine if this is an upgrade or downgrade based on price
            const action = newPlan.price > subscription.plan.price ? 'upgraded' : 'downgraded';
            changes.push(`Subscription plan ${action} from ${subscription.plan.name} to ${newPlan.name}`);

            // Handle payment difference (in a real app, you would process additional payment or prorate)
            // For upgrades, might charge the difference immediately
            // For downgrades, might apply credit to next billing cycle

            // Update the end date based on the new plan's interval
            const now = new Date();
            let newEndDate = new Date(now);

            if (newPlan.intervalType === 'monthly') {
                newEndDate.setMonth(newEndDate.getMonth() + 1);
            } else if (newPlan.intervalType === 'yearly') {
                newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            }

            updateData.endDate = newEndDate;
            updateData.nextPaymentDate = newEndDate;
        }

        // If no changes requested
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, message: 'No changes requested' },
                { status: 400 }
            );
        }

        // Update the subscription
        const updatedSubscription = await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: updateData,
            include: {
                plan: true,
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
            },
        });

        // Create a record of this change (in a real app, you might use a dedicated audit log)
        // For now, we'll just include it in the response

        return NextResponse.json(
            {
                success: true,
                message: changes.join('. '),
                subscription: updatedSubscription,
                changes,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update subscription error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}