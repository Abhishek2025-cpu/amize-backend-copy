/**
 * @swagger
 * /subscription-plans/{id}:
 *   put:
 *     summary: Update subscription plan
 *     description: >
 *       Updates an existing subscription plan. Only accessible to users with ADMIN role.
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
 *         description: ID of the subscription plan to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               intervalType:
 *                 type: string
 *               features:
 *                 type: array
 *     responses:
 *       200:
 *         description: Subscription plan updated successfully
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Request body validation schema
const updatePlanSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters" }).optional(),
    description: z.string().optional(),
    price: z.number().nonnegative({ message: "Price must be a non-negative number" }).optional(),
    currency: z.string().optional(),
    intervalType: z.enum(["monthly", "yearly"]).optional(),
    features: z.array(z.string()).optional(),
});

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const planId = params.id;

        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is an admin (only admins can update plans)
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                role: true,
            },
        });

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'You are not authorized to update subscription plans' },
                { status: 403 }
            );
        }

        // Check if plan exists
        const existingPlan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!existingPlan) {
            return NextResponse.json(
                { success: false, message: 'Subscription plan not found' },
                { status: 404 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = updatePlanSchema.safeParse(body);
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

        const { name, description, price, currency, intervalType, features } = validationResult.data;

        // Prepare update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = price;
        if (currency !== undefined) updateData.currency = currency;
        if (intervalType !== undefined) updateData.intervalType = intervalType;
        if (features !== undefined) updateData.features = JSON.stringify(features);

        // Update the subscription plan
        const updatedPlan = await prisma.subscriptionPlan.update({
            where: { id: planId },
            data: updateData,
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Subscription plan updated successfully',
                plan: {
                    ...updatedPlan,
                    features: features ? features : (updatedPlan.features ? JSON.parse(updatedPlan.features) : []),
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update subscription plan error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}