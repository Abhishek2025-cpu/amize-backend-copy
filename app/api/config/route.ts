/**
 * @swagger
 * /config:
 *   get:
 *     summary: Retrieve client application configuration
 *     description: >
 *       Fetches application configuration based on authentication status.
 *       Provides base configuration for all users and role-specific configurations
 *       for authenticated users.
 *     tags:
 *       - Configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 app:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: VideoHost App
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                     logo:
 *                       type: string
 *                       example: /logo.png
 *                     supportEmail:
 *                       type: string
 *                       example: support@videohost.com
 *                 features:
 *                   type: object
 *                   properties:
 *                     duets:
 *                       type: boolean
 *                     stitches:
 *                       type: boolean
 *                     liveStreaming:
 *                       type: boolean
 *                     effects:
 *                       type: boolean
 *                 maintenance:
 *                   type: object
 *                   properties:
 *                     isInMaintenance:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                 links:
 *                   type: object
 *                   properties:
 *                     privacyPolicy:
 *                       type: string
 *                     termsOfService:
 *                       type: string
 *                     helpCenter:
 *                       type: string
 *                     communityGuidelines:
 *                       type: string
 *                 user:
 *                   type: object
 *                   description: Role-specific configuration (only for authenticated users)
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum:
 *                         - USER
 *                         - CREATOR
 *                         - ADMIN
 *                     features:
 *                       type: object
 *                       properties:
 *                         monetizationEnabled:
 *                           type: boolean
 *                         analyticsEnabled:
 *                           type: boolean
 *                         creatorToolsEnabled:
 *                           type: boolean
 *                         adminPanelEnabled:
 *                           type: boolean
 *       500:
 *         description: Partial configuration due to internal error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 app:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Videohost App
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                 error:
 *                   type: string
 *                   example: Failed to load complete configuration
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        // Get authenticated user from token (optional)
        const authUser = await getAuthUser(request);

        // Base configuration available to everyone
        const baseConfig = {
            app: {
                name: process.env.APP_NAME || 'Amize Server',
                app_name: process.env.APP_NAME || 'Amize',
                version: process.env.APP_VERSION || '1.0.0',
                logo: process.env.APP_LOGO_URL || '/logo.png',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@amize.com',
            },
            features: {
                duets: true,
                stitches: true,
                liveStreaming: true,
                effects: true,
                soundEffects: true,
                greenScreen: true,
                textToSpeech: true,
            },
            limits: {
                maxVideoDuration: 180, // 3 minutes in seconds
                maxVideoSize: 100, // 100MB
                maxBioLength: 80,
                maxDescriptionLength: 150,
                maxCommentLength: 150,
                maxHashtagsPerVideo: 30,
            },
            maintenance: {
                isInMaintenance: process.env.MAINTENANCE_MODE === 'true',
                message: process.env.MAINTENANCE_MESSAGE || 'System is under maintenance. Please try again later.',
            },
            links: {
                privacyPolicy: process.env.PRIVACY_POLICY_URL || '/privacy-policy',
                termsOfService: process.env.TERMS_OF_SERVICE_URL || '/terms-of-service',
                helpCenter: process.env.HELP_CENTER_URL || '/help',
                communityGuidelines: process.env.COMMUNITY_GUIDELINES_URL || '/community-guidelines',
            },
        };

        // If user is authenticated, add user-specific or role-specific configuration
        if (authUser) {
            // Role-specific configuration
            const roleSpecificConfig: any = {
                features: {}
            };

            switch (authUser.role) {
                case 'USER':
                    roleSpecificConfig.features = {
                        monetizationEnabled: false,
                        analyticsEnabled: false,
                        creatorToolsEnabled: false,
                        adminPanelEnabled: false,
                    };
                    break;
                case 'CREATOR':
                    roleSpecificConfig.features = {
                        monetizationEnabled: true,
                        analyticsEnabled: true,
                        creatorToolsEnabled: true,
                        adminPanelEnabled: false,
                    };
                    break;
                case 'ADMIN':
                    roleSpecificConfig.features = {
                        monetizationEnabled: true,
                        analyticsEnabled: true,
                        creatorToolsEnabled: true,
                        adminPanelEnabled: true,
                    };
                    break;
            }

            return NextResponse.json(
                {
                    ...baseConfig,
                    user: {
                        role: authUser.role,
                        username: authUser.username,
                        ...roleSpecificConfig,
                    },
                },
                { status: 200 }
            );
        }

        // Return base configuration for unauthenticated users
        return NextResponse.json(baseConfig, { status: 200 });
    } catch (error: any) {
        console.error('Get config error:', error);
        return NextResponse.json(
            {
                app: {
                    name: 'Videohost App',
                    version: '1.0.0',
                },
                error: 'Failed to load complete configuration',
            },
            { status: 200 } // Still return 200 with minimal config
        );
    }
}