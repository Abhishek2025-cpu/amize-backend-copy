/**
 * @swagger
 * /subscription-plans:
 *   get:
 *     summary: Get available subscription plans
 *     description: >
 *       Retrieves a list of all available subscription plans or plans for a specific creator.
 *     tags:
 *       - Subscriptions
 *     parameters:
 *       - in: query
 *         name: creatorId
 *         schema:
 *           type: string
 *         description: Optional creator ID to filter plans for a specific creator
 *     responses:
 *       200:
 *         description: List of subscription plans
 *   post:
 *     summary: Create subscription plan
 *     description: >
 *       Creates a new subscription plan. Only accessible to users with ADMIN role
 *       or CREATOR role who are eligible for subscriptions.
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
 *               - name
 *               - price
 *               - intervalType
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
 *       201:
 *         description: Subscription plan created successfully
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Query parameters validation schema for GET
const getPlansQuerySchema = z.object({
    creatorId: z.string().uuid().optional(),
});

// Request body validation schema for POST
const createPlanSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters" }),
    description: z.string().optional(),
    price: z.number().nonnegative({ message: "Price must be a non-negative number" }),
    currency: z.string().default("USD"),
    intervalType: z.enum(["monthly", "yearly"]),
    features: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
    try {
        // Parse and validate query parameters
        const url = new URL(request.url);
        const validationResult = getPlansQuerySchema.safeParse(Object.fromEntries(url.searchParams));

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

        const { creatorId } = validationResult.data;

        // If creatorId is provided, verify the creator exists and is eligible
        if (creatorId) {
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
                },
            });

            if (!creator) {
                return NextResponse.json(
                    { success: false, message: 'Creator not found or is not eligible for subscriptions' },
                    { status: 404 }
                );
            }

            // Get plans and format features from JSON string to array
            const plans = await prisma.subscriptionPlan.findMany({
                orderBy: {
                    price: 'asc',
                },
            });

            const formattedPlans = plans.map(plan => ({
                ...plan,
                features: plan.features ? JSON.parse(plan.features) : [],
            }));

            return NextResponse.json(
                {
                    success: true,
                    plans: formattedPlans,
                    creator,
                },
                { status: 200 }
            );
        } else {
            // Get all plans
            const plans = await prisma.subscriptionPlan.findMany({
                orderBy: {
                    price: 'asc',
                },
            });

            const formattedPlans = plans.map(plan => ({
                ...plan,
                features: plan.features ? JSON.parse(plan.features) : [],
            }));

            return NextResponse.json(
                {
                    success: true,
                    plans: formattedPlans,
                },
                { status: 200 }
            );
        }
    } catch (error: any) {
        console.error('Get subscription plans error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

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

        // Check if user is an admin or eligible creator
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                role: true,
                isEligibleForCreator: true,
            },
        });

        if (!user || (user.role !== 'ADMIN' && (!user.isEligibleForCreator || user.role !== 'CREATOR'))) {
            return NextResponse.json(
                { success: false, message: 'You are not authorized to create subscription plans' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = createPlanSchema.safeParse(body);
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

        // Create the subscription plan
        const plan = await prisma.subscriptionPlan.create({
            data: {
                name,
                description,
                price,
                currency,
                intervalType,
                features: features ? JSON.stringify(features) : null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Subscription plan created successfully',
                plan: {
                    ...plan,
                    features: features || [],
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create subscription plan error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}