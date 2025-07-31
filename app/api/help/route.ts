/**
 * @swagger
 * /help:
 *   get:
 *     summary: Get help center content
 *     description: >
 *       Retrieves help center content including FAQs and categories.
 *     tags:
 *       - Help
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Optional category filter
 *     responses:
 *       200:
 *         description: Help center content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                 faqs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       question:
 *                         type: string
 *                       answer:
 *                         type: string
 *                       category:
 *                         type: string
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';

// Mock help center data
// In a real application, this would be stored in a database
const helpCategories = [
    { id: 'general', name: 'General' },
    { id: 'account', name: 'Account' },
    { id: 'service', name: 'Service' },
    { id: 'video', name: 'Video' },
];

const helpFaqs = [
    {
        id: '1',
        question: 'How do I create an account?',
        answer: 'You can sign up using your email, phone number, or a third-party account like Google or Facebook. Follow the on-screen instructions to complete the setup.',
        category: 'account'
    },
    {
        id: '2',
        question: 'Is the app free to use?',
        answer: 'Yes, our app is free to download and use. We do offer premium features through subscription plans, but the core functionality is available for free.',
        category: 'general'
    },
    {
        id: '3',
        question: 'How do I reset my password?',
        answer: 'Go to the login screen and click on "Forgot Password". Enter your email address, and we\'ll send you a link to reset your password.',
        category: 'account'
    },
    {
        id: '4',
        question: 'How do I make my account private?',
        answer: 'Go to Settings > Privacy, and toggle "Private Account" on. This will make your videos and profile visible only to approved followers.',
        category: 'account'
    },
    {
        id: '5',
        question: 'How do I upload a video?',
        answer: 'Tap the plus button at the bottom of the screen, then select or record a video. You can add effects, filters, and music before posting.',
        category: 'video'
    },
    {
        id: '6',
        question: 'What video formats are supported?',
        answer: 'We support MP4, MOV, and AVI formats. Videos can be up to 3 minutes long and maximum 100MB in size.',
        category: 'video'
    },
    {
        id: '7',
        question: 'How do I contact customer service?',
        answer: 'You can contact us through the app by going to Settings > Help Center > Contact Us, or by emailing support@example.com.',
        category: 'service'
    },
    {
        id: '8',
        question: 'How do I change my username?',
        answer: 'Go to Settings > Edit Profile, then tap on your current username to edit it. Usernames must be unique and can only contain letters, numbers, underscores, and periods.',
        category: 'account'
    },
];

export async function GET(request: Request) {
    try {
        // Parse query parameters
        const url = new URL(request.url);
        const category = url.searchParams.get('category');

        // Filter FAQs by category if provided
        let filteredFaqs = helpFaqs;
        if (category) {
            filteredFaqs = helpFaqs.filter(faq => faq.category === category);
        }

        return NextResponse.json(
            {
                success: true,
                categories: helpCategories,
                faqs: filteredFaqs,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get help center content error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}