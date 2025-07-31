/**
 * @swagger
 * /security/permissions:
 *   get:
 *     summary: Get app permissions
 *     description: >
 *       Retrieves all app permissions granted by the user, including camera, microphone, storage, etc.
 *     tags:
 *       - Security
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: App permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       granted:
 *                         type: boolean
 *                       required:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update app permission
 *     description: >
 *       Updates a specific app permission setting. Note that actual device permissions
 *       must be managed through the device's settings, this only tracks user preferences.
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
 *               - permissionId
 *               - granted
 *             properties:
 *               permissionId:
 *                 type: string
 *                 description: ID of the permission to update
 *               granted:
 *                 type: boolean
 *                 description: Whether the permission is granted
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       400:
 *         description: Validation error or required permission cannot be revoked
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

// Mock app permissions
// In a real application, this would be stored in a database and user preferences would be tracked
const appPermissions = [
    {
        id: 'camera',
        name: 'Camera',
        description: 'Access to your device camera for taking photos and recording videos',
        required: true,
    },
    {
        id: 'microphone',
        name: 'Microphone',
        description: 'Access to your device microphone for recording audio',
        required: true,
    },
    {
        id: 'storage',
        name: 'Storage',
        description: 'Access to your device storage for saving videos and photos',
        required: true,
    },
    {
        id: 'location',
        name: 'Location',
        description: 'Access to your device location for geotagging content',
        required: false,
    },
    {
        id: 'contacts',
        name: 'Contacts',
        description: 'Access to your contacts for finding friends',
        required: false,
    },
    {
        id: 'notifications',
        name: 'Notifications',
        description: 'Permission to send you notifications',
        required: false,
    },
    {
        id: 'background_processing',
        name: 'Background Processing',
        description: 'Allow app to work in the background',
        required: false,
    },
];

// User permission preferences
// In a real application, this would be stored in a database
const userPermissionPreferences = new Map([
    ['camera', true],
    ['microphone', true],
    ['storage', true],
    ['location', true],
    ['contacts', false],
    ['notifications', true],
    ['background_processing', true],
]);

// Validation schema for permission update
const permissionUpdateSchema = z.object({
    permissionId: z.string(),
    granted: z.boolean(),
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

        // Merge app permissions with user preferences
        const permissionsWithStatus = appPermissions.map(permission => ({
            ...permission,
            granted: userPermissionPreferences.get(permission.id) || false,
        }));

        return NextResponse.json(
            {
                success: true,
                permissions: permissionsWithStatus,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get app permissions error:', error);
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
        const validationResult = permissionUpdateSchema.safeParse(body);
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

        const { permissionId, granted } = validationResult.data;

        // Check if permission exists
        const permission = appPermissions.find(p => p.id === permissionId);
        if (!permission) {
            return NextResponse.json(
                { success: false, message: 'Permission not found' },
                { status: 404 }
            );
        }

        // Check if trying to revoke a required permission
        if (permission.required && !granted) {
            return NextResponse.json(
                { success: false, message: 'Required permission cannot be revoked' },
                { status: 400 }
            );
        }

        // Update user preference
        userPermissionPreferences.set(permissionId, granted);

        // In a real application, you would store this in a database
        // await prisma.userPermission.upsert({
        //   where: {
        //     userId_permissionId: {
        //       userId: authUser.userId,
        //       permissionId,
        //     },
        //   },
        //   update: { granted },
        //   create: {
        //     userId: authUser.userId,
        //     permissionId,
        //     granted,
        //   },
        // });

        return NextResponse.json(
            {
                success: true,
                message: 'Permission updated successfully',
                permission: {
                    ...permission,
                    granted,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update app permission error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}