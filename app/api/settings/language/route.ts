/**
 * @swagger
 * /settings/language:
 *   get:
 *     summary: Get language setting
 *     description: >
 *       Retrieves the current language preference for the authenticated user.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Language setting retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 language:
 *                   type: string
 *                   example: English
 *                 availableLanguages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update language setting
 *     description: >
 *       Updates the language preference for the authenticated user.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *             properties:
 *               language:
 *                 type: string
 *                 description: Preferred language
 *     responses:
 *       200:
 *         description: Language setting updated successfully
 *       400:
 *         description: Validation error or unsupported language
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// List of supported languages
const SUPPORTED_LANGUAGES = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-UK', name: 'English (UK)' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Mandarin' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ur', name: 'Urdu' },
    { code: 'ne', name: 'Nepali' },
];

// Validation schema for language setting update
const languageSettingSchema = z.object({
    language: z.string().min(2).max(50),
});

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

        // Get user's language setting
        const settings = await prisma.userSettings.findUnique({
            where: { userId: authUser.userId },
            select: {
                language: true,
            },
        });

        let language = 'English'; // Default

        if (settings) {
            language = settings.language;
        } else {
            // Create settings if they don't exist
            await prisma.userSettings.create({
                data: {
                    userId: authUser.userId,
                    language,
                },
            });
        }

        return NextResponse.json(
            {
                success: true,
                language,
                availableLanguages: SUPPORTED_LANGUAGES,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get language setting error:', error);
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
        const validationResult = languageSettingSchema.safeParse(body);
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

        const { language } = validationResult.data;

        // Check if language is supported
        // This is a loose check - in a real app, you might want to validate against exact matches
        const languageSupported = SUPPORTED_LANGUAGES.some(
            lang => lang.name.toLowerCase() === language.toLowerCase() ||
                lang.code.toLowerCase() === language.toLowerCase()
        );

        if (!languageSupported) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Unsupported language',
                    availableLanguages: SUPPORTED_LANGUAGES,
                },
                { status: 400 }
            );
        }

        // Update user's language setting
        const updatedSettings = await prisma.userSettings.upsert({
            where: { userId: authUser.userId },
            update: { language },
            create: {
                userId: authUser.userId,
                language,
            },
            select: {
                language: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Language setting updated successfully',
                language: updatedSettings.language,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update language setting error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}