/**
 * @swagger
 * /security/pin:
 *   get:
 *     summary: Check if PIN is set
 *     description: >
 *       Checks if the authenticated user has a PIN set up.
 *     tags:
 *       - Security
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PIN status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 hasPIN:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Set up PIN
 *     description: >
 *       Sets up a new PIN for the authenticated user.
 *     tags:
 *       - Security
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *               - confirmPin
 *               - password
 *             properties:
 *               pin:
 *                 type: string
 *                 description: New PIN (must be 4-6 digits)
 *               confirmPin:
 *                 type: string
 *                 description: Confirmation of new PIN
 *               password:
 *                 type: string
 *                 description: User's current password for verification
 *     responses:
 *       200:
 *         description: PIN set up successfully
 *       400:
 *         description: Validation error or PINs don't match
 *       401:
 *         description: Unauthorized or incorrect password
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Change PIN
 *     description: >
 *       Changes the PIN for the authenticated user.
 *     tags:
 *       - Security
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPin
 *               - newPin
 *               - confirmPin
 *             properties:
 *               currentPin:
 *                 type: string
 *                 description: Current PIN
 *               newPin:
 *                 type: string
 *                 description: New PIN (must be 4-6 digits)
 *               confirmPin:
 *                 type: string
 *                 description: Confirmation of new PIN
 *     responses:
 *       200:
 *         description: PIN changed successfully
 *       400:
 *         description: Validation error or PINs don't match
 *       401:
 *         description: Unauthorized or incorrect current PIN
 *       404:
 *         description: PIN not set up yet
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Remove PIN
 *     description: >
 *       Removes the PIN for the authenticated user.
 *     tags:
 *       - Security
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPin
 *               - password
 *             properties:
 *               currentPin:
 *                 type: string
 *                 description: Current PIN
 *               password:
 *                 type: string
 *                 description: User's current password for verification
 *     responses:
 *       200:
 *         description: PIN removed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized or incorrect PIN/password
 *       404:
 *         description: PIN not set up yet
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

// Validation schema for PIN setup
const pinSetupSchema = z.object({
    pin: z.string().regex(/^\d{4,6}$/, { message: "PIN must be 4-6 digits" }),
    confirmPin: z.string().regex(/^\d{4,6}$/, { message: "Confirm PIN must be 4-6 digits" }),
    password: z.string().min(1, "Password is required for verification"),
}).refine(data => data.pin === data.confirmPin, {
    message: "PINs don't match",
    path: ["confirmPin"],
});

// Validation schema for PIN change
const pinChangeSchema = z.object({
    currentPin: z.string().regex(/^\d{4,6}$/, { message: "Current PIN must be 4-6 digits" }),
    newPin: z.string().regex(/^\d{4,6}$/, { message: "New PIN must be 4-6 digits" }),
    confirmPin: z.string().regex(/^\d{4,6}$/, { message: "Confirm PIN must be 4-6 digits" }),
}).refine(data => data.newPin === data.confirmPin, {
    message: "New PINs don't match",
    path: ["confirmPin"],
});

// Validation schema for PIN removal
const pinRemovalSchema = z.object({
    currentPin: z.string().regex(/^\d{4,6}$/, { message: "Current PIN must be 4-6 digits" }),
    password: z.string().min(1, "Password is required for verification"),
});

// Helper function to hash PIN
async function hashPin(pin: string): Promise<string> {
    return await bcrypt.hash(pin, 10);
}

// Helper function to verify PIN
async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
    return await bcrypt.compare(pin, hashedPin);
}

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

        // Check if user has a PIN set up
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                pin: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                hasPIN: !!user.pin,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Check PIN status error:', error);
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

        const body = await request.json();

        // Validate request body
        const validationResult = pinSetupSchema.safeParse(body);
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

        const { pin, password } = validationResult.data;

        // Check if user already has a PIN
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                pin: true,
                passwordHash: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        if (user.pin) {
            return NextResponse.json(
                { success: false, message: 'PIN already set up. Use PUT to change it.' },
                { status: 400 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Incorrect password' },
                { status: 401 }
            );
        }

        // Hash PIN
        const hashedPin = await hashPin(pin);

        // Set PIN
        await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                pin: hashedPin,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'PIN set up successfully',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Set up PIN error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
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
        const validationResult = pinChangeSchema.safeParse(body);
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

        const { currentPin, newPin } = validationResult.data;

        // Check if user has a PIN
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                pin: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        if (!user.pin) {
            return NextResponse.json(
                { success: false, message: 'PIN not set up yet. Use POST to set it up.' },
                { status: 404 }
            );
        }

        // Verify current PIN
        const isPinValid = await verifyPin(currentPin, user.pin);
        if (!isPinValid) {
            return NextResponse.json(
                { success: false, message: 'Incorrect current PIN' },
                { status: 401 }
            );
        }

        // Hash new PIN
        const hashedPin = await hashPin(newPin);

        // Update PIN
        await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                pin: hashedPin,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'PIN changed successfully',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Change PIN error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
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
        const validationResult = pinRemovalSchema.safeParse(body);
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

        const { currentPin, password } = validationResult.data;

        // Check if user has a PIN
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                pin: true,
                passwordHash: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        if (!user.pin) {
            return NextResponse.json(
                { success: false, message: 'PIN not set up yet' },
                { status: 404 }
            );
        }

        // Verify current PIN
        const isPinValid = await verifyPin(currentPin, user.pin);
        if (!isPinValid) {
            return NextResponse.json(
                { success: false, message: 'Incorrect PIN' },
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Incorrect password' },
                { status: 401 }
            );
        }

        // Remove PIN
        await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                pin: null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'PIN removed successfully',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Remove PIN error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}