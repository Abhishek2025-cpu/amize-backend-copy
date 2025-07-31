/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit contact form
 *     description: >
 *       Processes contact form submissions and sends emails to the support team.
 *       Supports various inquiry categories including account deletion requests.
 *     tags:
 *       - Contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the person contacting
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the person contacting
 *                 example: "john.doe@example.com"
 *               subject:
 *                 type: string
 *                 description: Subject line for the inquiry
 *                 example: "Need help with my account"
 *               message:
 *                 type: string
 *                 description: Detailed message content
 *                 example: "I'm having trouble accessing my account..."
 *               category:
 *                 type: string
 *                 enum: [general, account, deletion, technical, partnership]
 *                 description: Category of the inquiry
 *                 example: "account"
 *     responses:
 *       200:
 *         description: Contact form submitted successfully
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
 *                   example: "Your message has been sent successfully. We'll get back to you within 24 hours."
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
 *                   description: Error message
 *                 errors:
 *                   type: array
 *                   description: Detailed validation errors
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

// Request body validation schema
const contactFormSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }).max(100, { message: "Name cannot exceed 100 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    subject: z.string().min(1, { message: "Subject is required" }).max(200, { message: "Subject cannot exceed 200 characters" }),
    message: z.string().min(10, { message: "Message must be at least 10 characters" }).max(2000, { message: "Message cannot exceed 2000 characters" }),
    category: z.enum(['bug','general', 'account', 'deletion', 'technical', 'partnership'], {
        errorMap: () => ({ message: "Invalid category selected" })
    })
});

// Category information for email routing and formatting
const categoryInfo = {
    general: {
        label: 'General Inquiry',
        priority: 'normal',
        department: 'Support'
    },
    account: {
        label: 'Account Issues',
        priority: 'high',
        department: 'Support'
    },
    deletion: {
        label: 'Account Deletion Request',
        priority: 'high',
        department: 'Privacy & Data Protection'
    },
    technical: {
        label: 'Technical Support',
        priority: 'high',
        department: 'Technical Support'
    },
    partnership: {
        label: 'Partnership Inquiry',
        priority: 'normal',
        department: 'Business Development'
    },
    bug: {
        label: 'Bug Report',
        priority: 'high',
        department: 'Technical Support'
    }
};

/**
 * Generate HTML email template for contact form submissions
 */
function generateContactEmailTemplate(data: any, category: any): string {
    const priorityColor = category.priority === 'high' ? '#ef4444' : '#06b6d4';
    const priorityLabel = category.priority === 'high' ? 'HIGH PRIORITY' : 'NORMAL PRIORITY';

    return `
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ec4899, #ef4444); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <div style="width: 28px; height: 28px; border: 3px solid white; border-radius: 50%; position: relative;">
                    <div style="width: 6px; height: 6px; background: white; border-radius: 50%; position: absolute; top: 8px; left: 8px;"></div>
                </div>
            </div>
            <h2 style="margin: 0 0 16px; color: white; font-size: 28px; font-weight: 700;">New Contact Form Submission</h2>
            <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">Received via Amize Contact Form</p>
        </div>

        <div style="background: linear-gradient(135deg, #1f2937, #374151); border-radius: 16px; padding: 24px; margin: 32px 0; border-left: 4px solid ${priorityColor};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; color: white; font-size: 20px; font-weight: 600;">${category.label}</h3>
                <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;">${priorityLabel}</span>
            </div>
            <p style="margin: 0; color: #d1d5db; font-size: 14px;">Department: ${category.department}</p>
        </div>

        <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h4 style="margin: 0 0 16px; color: #ec4899; font-size: 16px; font-weight: 600;">Contact Information</h4>
            <div style="grid-template-columns: 1fr 1fr; gap: 16px; display: grid;">
                <div>
                    <p style="margin: 0 0 4px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Name</p>
                    <p style="margin: 0; color: white; font-size: 16px; font-weight: 500;">${data.name}</p>
                </div>
                <div>
                    <p style="margin: 0 0 4px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</p>
                    <p style="margin: 0; color: white; font-size: 16px; font-weight: 500;">${data.email}</p>
                </div>
            </div>
        </div>

        <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h4 style="margin: 0 0 16px; color: #ec4899; font-size: 16px; font-weight: 600;">Subject</h4>
            <p style="margin: 0; color: white; font-size: 18px; font-weight: 500; line-height: 1.5;">${data.subject}</p>
        </div>

        <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h4 style="margin: 0 0 16px; color: #ec4899; font-size: 16px; font-weight: 600;">Message</h4>
            <div style="color: #d1d5db; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">${data.message}</div>
        </div>

        ${data.category === 'deletion' ? `
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
            <h4 style="margin: 0 0 12px; color: white; font-size: 18px; font-weight: 700;">⚠️ Account Deletion Request</h4>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; line-height: 1.6;">
                This is a data deletion request. Please handle according to GDPR/CCPA compliance procedures. 
                Process within 7-14 business days and confirm deletion with the user.
            </p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 40px 0;">
            <p style="margin: 0 0 16px; color: #9ca3af; font-size: 14px;">
                Submitted on ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    })} UTC
            </p>
            <a href="mailto:${data.email}" style="display: inline-block; background: #374151; color: #ec4899; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #4b5563;">
                Reply to ${data.name}
            </a>
        </div>
    `;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = contactFormSchema.safeParse(body);
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

        const { name, email, subject, message, category } = validationResult.data;
        const categoryData = categoryInfo[category];

        // Generate email content
        const emailContent = generateContactEmailTemplate(validationResult.data, categoryData);

        // Create email subject with category and priority
        const emailSubject = `[${categoryData.label}] ${subject}`;

        // Send email to support team
        await sendEmail({
            to: 'amize2026@gmail.com', // Send to the specified email
            subject: emailSubject,
            text: `
New Contact Form Submission

Category: ${categoryData.label}
Priority: ${categoryData.priority.toUpperCase()}
Department: ${categoryData.department}

From: ${name} (${email})
Subject: ${subject}

Message:
${message}

Submitted: ${new Date().toISOString()}
            `,
            html: emailContent,
        });

        // Optional: Send confirmation email to the user
        try {
            await sendEmail({
                to: email,
                subject: 'We received your message - Amize Support',
                text: `Hello ${name},

Thank you for contacting Amize support. We have received your message regarding "${subject}" and will respond within 24 hours.

Your inquiry has been categorized as: ${categoryData.label}

If this is urgent, please don't hesitate to reach out again.

Best regards,
Amize Support Team`,
                html: `
                    <div style="text-align: center; margin-bottom: 32px;">
                        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                            <div style="width: 24px; height: 24px; border: 3px solid white; border-radius: 50%; position: relative;">
                                <div style="width: 6px; height: 6px; background: white; border-radius: 50%; position: absolute; top: 6px; left: 6px;"></div>
                            </div>
                        </div>
                        <h2 style="margin: 0 0 16px; color: white; font-size: 28px; font-weight: 700;">Message Received!</h2>
                        <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">We'll get back to you soon</p>
                    </div>

                    <div style="margin-bottom: 32px;">
                        <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                            Hello ${name},
                        </p>
                        <p style="margin: 0 0 32px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                            Thank you for contacting Amize support. We have successfully received your message regarding "<strong style="color: white;">${subject}</strong>" and our team will respond within 24 hours.
                        </p>
                    </div>

                    <div style="background: linear-gradient(135deg, #1f2937, #374151); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
                        <h3 style="margin: 0 0 16px; color: white; font-size: 20px; font-weight: 600;">Your Inquiry Details</h3>
                        <p style="margin: 0 0 8px; color: #ec4899; font-size: 14px; font-weight: 600;">Category: ${categoryData.label}</p>
                        <p style="margin: 0; color: #d1d5db; font-size: 14px;">Reference ID: ${Date.now()}</p>
                    </div>

                    <div style="text-align: center; margin-top: 40px;">
                        <p style="margin: 0 0 16px; color: #9ca3af; font-size: 14px;">
                            Need immediate assistance? Check our help center
                        </p>
                        <a href="https://amize.com/help" style="display: inline-block; background: #374151; color: #ec4899; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #4b5563;">
                            Visit Help Center
                        </a>
                    </div>
                `
            });
        } catch (confirmationError) {
            // Log the error but don't fail the main request
            console.error('Failed to send confirmation email:', confirmationError);
        }

        return NextResponse.json(
            {
                success: true,
                message: "Your message has been sent successfully. We'll get back to you within 24 hours."
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Contact form submission error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}