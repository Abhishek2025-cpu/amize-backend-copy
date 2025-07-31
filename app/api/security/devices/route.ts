/**
 * @swagger
 * /security/devices:
 *   get:
 *     summary: Get all devices
 *     description: >
 *       Retrieves a list of all devices that have logged into the authenticated user's account.
 *     tags:
 *       - Security
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of devices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 devices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       deviceId:
 *                         type: string
 *                       deviceName:
 *                         type: string
 *                       deviceModel:
 *                         type: string
 *                       osVersion:
 *                         type: string
 *                       appVersion:
 *                         type: string
 *                       ipAddress:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       loginTimestamp:
 *                         type: string
 *                         format: date-time
 *                       logoutTimestamp:
 *                         type: string
 *                         format: date-time
 *                       isCurrentDevice:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

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

        // Get request headers for device identification
        const userAgent = request.headers.get('user-agent') || '';
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') || 'unknown';

        // Get all devices for the user
        const devices = await prisma.deviceHistory.findMany({
            where: {
                userId: authUser.userId
            },
            orderBy: [
                { isActive: 'desc' },
                { loginTimestamp: 'desc' },
            ],
        });

        // Add a flag to identify the current device
        // This is a simple heuristic and might not be 100% accurate
        const devicesWithCurrentFlag = devices.map(device => ({
            ...device,
            isCurrentDevice: device.isActive &&
                device.ipAddress === ipAddress &&
                (device.deviceName?.includes(userAgent.substring(0, 10)) || false)
        }));

        return NextResponse.json(
            {
                success: true,
                devices: devicesWithCurrentFlag,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get devices error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * @swagger
 * /security/devices/{id}:
 *   delete:
 *     summary: Remove device
 *     description: >
 *       Logs out and removes a device from the authenticated user's account.
 *     tags:
 *       - Security
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID to remove
 *     responses:
 *       200:
 *         description: Device removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot remove current device
 *       404:
 *         description: Device not found
 *       500:
 *         description: Internal server error
 */

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const deviceId = params.id;

        // Check if device exists and belongs to user
        const device = await prisma.deviceHistory.findFirst({
            where: {
                id: deviceId,
                userId: authUser.userId,
            },
        });

        if (!device) {
            return NextResponse.json(
                { success: false, message: 'Device not found' },
                { status: 404 }
            );
        }

        // Get request headers for device identification
        const userAgent = request.headers.get('user-agent') || '';
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') || 'unknown';

        // Check if trying to remove current device
        // This is a simple heuristic and might not be 100% accurate
        const isCurrentDevice = device.isActive &&
            device.ipAddress === ipAddress &&
            (device.deviceName?.includes(userAgent.substring(0, 10)) || false);

        if (isCurrentDevice) {
            return NextResponse.json(
                { success: false, message: 'Cannot remove current device. Use logout instead.' },
                { status: 403 }
            );
        }

        // Update device to inactive
        await prisma.deviceHistory.update({
            where: { id: deviceId },
            data: {
                isActive: false,
                logoutTimestamp: new Date(),
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Device removed successfully',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Remove device error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}