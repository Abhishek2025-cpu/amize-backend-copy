/**
 * @swagger
 * /help/contact:
 *   get:
 *     summary: Get contact methods
 *     description: >
 *       Retrieves available contact methods for customer support.
 *     tags:
 *       - Help
 *     responses:
 *       200:
 *         description: Contact methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 contactMethods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       value:
 *                         type: string
 *                       description:
 *                         type: string
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Send support message
 *     description: >
 *       Sends a support message to customer service.
 *     tags:
 *       - Help
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *               - contactMethod
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Subject of the message
 *               message:
 *                 type: string
 *                 description: Content of the message
 *               contactMethod:
 *                 type: string
 *                 description: Preferred contact method ID
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional file attachments
 *     responses:
 *       200:
 *         description: Support message sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

// Mock contact methods
// In a real application, this would be stored in a database
const contactMethods = [
    {
        id: 'customer-service',
        name: 'Customer Service',
        icon: 'headset',
        value: 'support@example.com',
        description: 'Contact our customer service team for general inquiries and support'
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: 'whatsapp',
        value: '+1-800-123-4567',
        description: 'Message us on WhatsApp for quick assistance'
    },
    {
        id: 'website',
        name: 'Website',
        icon: 'globe',
        value: 'https://support.example.com',
        description: 'Visit our support portal for comprehensive help and resources'
    },
    {
        id: 'facebook',
        name: 'Facebook',
        icon: 'facebook',
        value: 'facebook.com/exampleapp',
        description: 'Message us on our Facebook page'
    },
    {
        id: 'twitter',
        name: 'Twitter',
        icon: 'twitter',
        value: '@exampleapp',
        description: 'Reach out to us on Twitter for public inquiries'
    },
    {
        id: 'instagram',
        name: 'Instagram',
        icon: 'instagram',
        value: '@exampleapp',
        description: 'Direct message us on Instagram'
    }
];

// Validation schema for support message
const supportMessageSchema = z.object({
    subject: z.string().min(3, { message: "Subject must be at least 3 characters" })
        .max(100, { message: "Subject cannot exceed 100 characters" }),
    message: z.string().min(10, { message: "Message must be at least 10 characters" })
        .max(2000, { message: "Message cannot exceed 2000 characters" }),
    contactMethod: z.string(),
    attachments: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
    try {
        return NextResponse.json(
            {
                success: true,
                contactMethods,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get contact methods error:', error);
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
        const validationResult = supportMessageSchema.safeParse(body);
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

        const { subject, message, contactMethod, attachments } = validationResult.data;

        // Verify that the contact method exists
        const methodExists = contactMethods.some(method => method.id === contactMethod);
        if (!methodExists) {
            return NextResponse.json(
                { success: false, message: 'Invalid contact method' },
                { status: 400 }
            );
        }

        // In a real application, you would:
        // 1. Store the support ticket in your database
        // 2. Send notifications to your support team
        // 3. Process any attachments
        // 4. Send a confirmation email to the user

        // For this example, we'll just return a success response
        return NextResponse.json(
            {
                success: true,
                message: 'Support message sent successfully',
                ticketId: `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                estimatedResponseTime: '24 hours',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Send support message error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}