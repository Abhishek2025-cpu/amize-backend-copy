/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User authentication endpoint
 *     description: Authenticates a user with email and password, returns JWT tokens
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (min 6 characters)
 *               deviceId:
 *                 type: string
 *                 description: Optional unique identifier for the device
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   deviceName:
 *                     type: string
 *                     description: Name of the device
 *                   deviceModel:
 *                     type: string
 *                     description: Model of the device
 *                   osVersion:
 *                     type: string
 *                     description: Operating system version
 *                   appVersion:
 *                     type: string
 *                     description: Application version
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     lastLoginAt:
 *                       type: string
 *                       format: date-time
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       403:
 *         description: Account disabled or suspended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Your account is inactive or suspended
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Request body validation schema
const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(4, { message: "Password must be at least 4 characters" }),
    deviceId: z.string().optional(),
    deviceInfo: z.object({
        deviceName: z.string().optional(),
        deviceModel: z.string().optional(),
        osVersion: z.string().optional(),
        appVersion: z.string().optional(),
    }).optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = loginSchema.safeParse(body);
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

        const { email, password, deviceId, deviceInfo } = validationResult.data;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                interests: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Check if user exists
        if (!user) {
            console.log("No user fetched")
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Check if user is active (not deactivated)
        if (user.deactivatedAt) {
            return NextResponse.json(
                { success: false, message: 'Your account is inactive or suspended' },
                { status: 403 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        console.log("Password valid" + isPasswordValid)
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Generate JWT token (no expiration)
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET as string
            // No expiration set - token will not expire
        );

        // Generate refresh token (no expiration)
        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET as string
            // No expiration set - refresh token will not expire
        );

        // Record device history if deviceId is provided
        if (deviceId) {
            const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

            await prisma.deviceHistory.create({
                data: {
                    userId: user.id,
                    deviceId,
                    deviceName: deviceInfo?.deviceName,
                    deviceModel: deviceInfo?.deviceModel,
                    osVersion: deviceInfo?.osVersion,
                    appVersion: deviceInfo?.appVersion,
                    ipAddress,
                    isActive: true,
                },
            });
        }

        // Update last login timestamp
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Filter out sensitive information
        const { passwordHash, forgotPasswordToken, forgotPasswordExpiry, pin, ...userWithoutSensitiveData } = user;

        return NextResponse.json(
            {
                success: true,
                message: 'Login successful',
                user: userWithoutSensitiveData,
                token,
                refreshToken,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}