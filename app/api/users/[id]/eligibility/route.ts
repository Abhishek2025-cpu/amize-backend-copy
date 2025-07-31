/**
 * @swagger
 * /users/{id}/eligibility:
 *   patch:
 *     summary: Update creator eligibility status
 *     description: >
 *       Admin endpoint to approve or reject a user's application to become a creator.
 *       Only accessible to users with ADMIN role.
 *     tags:
 *       - Admin
 *       - Creators
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update eligibility
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eligible
 *             properties:
 *               eligible:
 *                 type: boolean
 *                 description: Whether the user is eligible to be a creator (true for approve, false for reject)
 *               adminNotes:
 *                 type: string
 *                 description: Optional notes from the admin regarding the decision
 *               monetizationEnabled:
 *                 type: boolean
 *                 description: Whether the user can immediately monetize content (default false)
 *     responses:
 *       200:
 *         description: Eligibility status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not an admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema for eligibility update
const eligibilityUpdateSchema = z.object({
    eligible: z.boolean({
        required_error: "Eligibility decision is required",
        invalid_type_error: "Eligibility must be a boolean",
    }),
    adminNotes: z.string().max(500).optional(),
    monetizationEnabled: z.boolean().optional().default(false),
});

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const userId = params.id;

        // Get authenticated user (admin) from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify admin privileges
        const admin = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                role: true,
            },
        });

        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Forbidden - requires admin privileges' },
                { status: 403 }
            );
        }

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isEligibleForCreator: true,
                monetizationEnabled: true,
            },
        });

        if (!targetUser) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        const body = await request.json();

        // Validate request body
        const validationResult = eligibilityUpdateSchema.safeParse(body);
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

        const { eligible, adminNotes, monetizationEnabled } = validationResult.data;

        // Prepare update data
        const updateData: any = {
            isEligibleForCreator: eligible,
            monetizationEnabled: eligible ? monetizationEnabled : false,
        };

        // If approving as a creator, update role
        if (eligible && targetUser.role === 'USER') {
            updateData.role = 'CREATOR';
        }

        // If rejecting and current role is CREATOR, don't downgrade role
        // This allows admins to disable monetization without removing creator status

        // Update the user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                role: true,
                isEligibleForCreator: true,
                monetizationEnabled: true,
            },
        });

        // Create a notification for the user (in a real app)
        // Send an email notification (in a real app)

        return NextResponse.json(
            {
                success: true,
                message: eligible
                    ? 'User approved as creator successfully'
                    : 'User rejected as creator',
                user: updatedUser,
                adminNotes: adminNotes || undefined,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update eligibility error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}