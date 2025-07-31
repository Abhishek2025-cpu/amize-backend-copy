/**
 * @swagger
 * /profile/photo:
 *   post:
 *     summary: Upload profile photo
 *     description: >
 *       Uploads a new profile photo for the authenticated user.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (JPEG, PNG, etc.)
 *     responses:
 *       200:
 *         description: Profile photo uploaded successfully
 *       400:
 *         description: Invalid file format or size
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Remove profile photo
 *     description: >
 *       Removes the current profile photo of the authenticated user.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile photo removed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

// Helper function to handle file upload
// In a real implementation, this would upload to a storage service like S3
async function uploadProfilePhoto(file: File) {
    // This is a placeholder for actual file upload logic
    // In a real implementation, you would:
    // 1. Check file size and type
    // 2. Upload to storage service
    // 3. Return the URL of the uploaded file

    // For this example, we'll just return a mock URL
    return `https://example.com/profile-photos/${Date.now()}-${file.name}`;
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

        // Parse the form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP' },
                { status: 400 }
            );
        }

        // Check file size (e.g., max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, message: 'File size exceeds the 5MB limit' },
                { status: 400 }
            );
        }

        // Upload the file and get the URL
        const profilePhotoUrl = await uploadProfilePhoto(file);

        // Create an upload record in the database
        const upload = await prisma.upload.create({
            data: {
                fileName: `profile_${authUser.userId}_${Date.now()}.${file.name.split('.').pop()}`,
                originalFileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileUrl: profilePhotoUrl,
                fileKey: profilePhotoUrl.split('/').pop() || '',
                uploadType: 'PROFILE_PHOTO',
                status: 'COMPLETED',
                userId: authUser.userId,
            },
        });

        // Update the user's profilePhotoUrl
        const updatedUser = await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                profilePhotoUrl,
            },
            select: {
                id: true,
                profilePhotoUrl: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Profile photo uploaded successfully',
                profilePhotoUrl: updatedUser.profilePhotoUrl,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Upload profile photo error:', error);
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

        // Get the current profile photo URL
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            select: {
                profilePhotoUrl: true,
            },
        });

        if (!user || !user.profilePhotoUrl) {
            return NextResponse.json(
                { success: false, message: 'No profile photo to remove' },
                { status: 400 }
            );
        }

        // In a real implementation, you would delete the file from storage here
        // For example: await deleteFileFromS3(user.profilePhotoUrl);

        // Update the user's profilePhotoUrl to null
        await prisma.user.update({
            where: { id: authUser.userId },
            data: {
                profilePhotoUrl: null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Profile photo removed successfully',
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Remove profile photo error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}