/**
 * @swagger
 * /upload/{id}:
 *   get:
 *     summary: Get upload details by ID
 *     description: >
 *       Retrieves detailed information about a specific upload.
 *       User must be the owner of the upload or an admin.
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Upload ID
 *     responses:
 *       200:
 *         description: Upload details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 upload:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     originalFileName:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *                     fileType:
 *                       type: string
 *                     fileSize:
 *                       type: integer
 *                     uploadType:
 *                       type: string
 *                     status:
 *                       type: string
 *                     width:
 *                       type: integer
 *                     height:
 *                       type: integer
 *                     duration:
 *                       type: number
 *                     thumbnailUrl:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
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
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden
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
 *                   example: You do not have permission to access this upload
 *       404:
 *         description: Upload not found
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
 *                   example: Upload not found
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
 *
 *   delete:
 *     summary: Delete an upload
 *     description: >
 *       Deletes an upload and its associated file.
 *       User must be the owner of the upload or an admin.
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Upload ID
 *     responses:
 *       200:
 *         description: Upload deleted successfully
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
 *                   example: Upload deleted successfully
 *       401:
 *         description: Unauthorized
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
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden
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
 *                   example: You do not have permission to delete this upload
 *       404:
 *         description: Upload not found
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
 *                   example: Upload not found
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
 *
 *   patch:
 *     summary: Update upload details
 *     description: >
 *       Updates metadata for an existing upload.
 *       User must be the owner of the upload or an admin.
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Upload ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalFileName:
 *                 type: string
 *                 description: Original file name
 *               uploadType:
 *                 type: string
 *                 enum: [PROFILE_PHOTO, VIDEO, THUMBNAIL, SOUND, OTHER]
 *                 description: Type of upload
 *     responses:
 *       200:
 *         description: Upload updated successfully
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
 *                   example: Upload updated successfully
 *                 upload:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     originalFileName:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *                     fileType:
 *                       type: string
 *                     uploadType:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid request
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
 *       401:
 *         description: Unauthorized
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
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden
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
 *                   example: You do not have permission to update this upload
 *       404:
 *         description: Upload not found
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
 *                   example: Upload not found
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
import { PrismaClient, UploadType } from '@prisma/client';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { z } from 'zod';
import { deleteFromS3 } from '@/lib/services/s3Service';
import { processVideo } from '@/utils/video-helper';
import { processImage } from '@/utils/image-helper';

import { prisma } from '@/lib/prisma';

interface Params {
    params: Promise<{
        id: string;
    }>;
}

// Validation schema for PATCH requests
const updateUploadSchema = z.object({
    originalFileName: z.string().optional(),
    uploadType: z.enum(['PROFILE_PHOTO', 'VIDEO', 'THUMBNAIL', 'SOUND', 'OTHER']).optional()
});

/**
 * Helper function to check if user has permission to access the upload
 */
async function hasUploadPermission(uploadId: string, userId: string, isUserAdmin: boolean): Promise<boolean> {
    const upload = await prisma.upload.findUnique({
        where: { id: uploadId }
    });

    if (!upload) {
        return false;
    }

    return upload.userId === userId || isUserAdmin;
}

export async function GET(request: Request, props: Params) {
    const params = await props.params;
    try {
        const { id } = params;

        // Check authentication
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get upload
        const upload = await prisma.upload.findUnique({
            where: { id }
        });

        // Check if upload exists
        if (!upload) {
            return NextResponse.json(
                { success: false, message: 'Upload not found' },
                { status: 404 }
            );
        }

        // Check if user has permission (upload owner or admin)
        const isUserAdmin = isAdmin(authUser);
        if (upload.userId !== authUser.userId && !isUserAdmin) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to access this upload' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                upload: {
                    id: upload.id,
                    fileName: upload.fileName,
                    originalFileName: upload.originalFileName,
                    fileUrl: upload.fileUrl,
                    fileType: upload.fileType,
                    fileSize: upload.fileSize,
                    uploadType: upload.uploadType,
                    status: upload.status,
                    width: upload.width,
                    height: upload.height,
                    duration: upload.duration,
                    thumbnailUrl: upload.thumbnailUrl,
                    processingError: upload.processingError,
                    createdAt: upload.createdAt,
                    updatedAt: upload.updatedAt,
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get upload details error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, props: Params) {
    const params = await props.params;
    try {
        const { id } = params;

        // Check authentication
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get upload
        const upload = await prisma.upload.findUnique({
            where: { id }
        });

        // Check if upload exists
        if (!upload) {
            return NextResponse.json(
                { success: false, message: 'Upload not found' },
                { status: 404 }
            );
        }

        // Check if user has permission (upload owner or admin)
        const isUserAdmin = isAdmin(authUser);
        if (upload.userId !== authUser.userId && !isUserAdmin) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to delete this upload' },
                { status: 403 }
            );
        }

        // Delete file from S3
        if (upload.fileKey) {
            try {
                await deleteFromS3(upload.fileKey);
                console.log(`Deleted file from S3: ${upload.fileKey}`);
            } catch (error) {
                console.error(`Failed to delete file from S3: ${upload.fileKey}`, error);
                // Continue execution to delete the database record even if S3 delete fails
            }
        }

        // Delete thumbnail if exists
        if (upload.thumbnailUrl) {
            // Extract the key from the URL
            // This assumes your thumbnailUrl is structured as https://bucket-name.s3.region.amazonaws.com/key
            const thumbnailUrlObj = new URL(upload.thumbnailUrl);
            const thumbnailKey = thumbnailUrlObj.pathname.substring(1); // Remove leading slash

            try {
                await deleteFromS3(thumbnailKey);
                console.log(`Deleted thumbnail from S3: ${thumbnailKey}`);
            } catch (error) {
                console.error(`Failed to delete thumbnail from S3: ${thumbnailKey}`, error);
                // Continue execution
            }
        }

        // Delete upload record from database
        await prisma.upload.delete({
            where: { id }
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Upload deleted successfully'
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete upload error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request, props: Params) {
    const params = await props.params;
    try {
        const { id } = params;

        // Check authentication
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get upload
        const upload = await prisma.upload.findUnique({
            where: { id }
        });

        // Check if upload exists
        if (!upload) {
            return NextResponse.json(
                { success: false, message: 'Upload not found' },
                { status: 404 }
            );
        }

        // Check if user has permission (upload owner or admin)
        const isUserAdmin = isAdmin(authUser);
        if (upload.userId !== authUser.userId && !isUserAdmin) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to update this upload' },
                { status: 403 }
            );
        }

        // Validate request body
        const body = await request.json();
        const validationResult = updateUploadSchema.safeParse(body);

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

        const { originalFileName, uploadType } = validationResult.data;

        // Prepare update data
        const updateData: any = {};

        if (originalFileName !== undefined) {
            updateData.originalFileName = originalFileName;
        }

        // If upload type is changing, update related paths and potentially reprocess
        if (uploadType && uploadType !== upload.uploadType) {
            updateData.uploadType = uploadType;

            // If we're changing to/from VIDEO or PROFILE_PHOTO, we may need to reprocess
            if (uploadType === 'VIDEO' && upload.status === 'COMPLETED') {
                // Schedule video processing
                setTimeout(() => {
                    processVideo(id).catch(err => {
                        console.error(`Error processing video ${id} after type change:`, err);
                    });
                }, 0);

                updateData.status = 'PROCESSING';
            } else if (uploadType === 'PROFILE_PHOTO' && upload.status === 'COMPLETED') {
                // Schedule image processing
                setTimeout(() => {
                    processImage(id).catch(err => {
                        console.error(`Error processing image ${id} after type change:`, err);
                    });
                }, 0);

                updateData.status = 'PROCESSING';
            }
        }

        // Update upload record
        const updatedUpload = await prisma.upload.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Upload updated successfully',
                upload: {
                    id: updatedUpload.id,
                    fileName: updatedUpload.fileName,
                    originalFileName: updatedUpload.originalFileName,
                    fileUrl: updatedUpload.fileUrl,
                    fileType: updatedUpload.fileType,
                    fileSize: updatedUpload.fileSize,
                    uploadType: updatedUpload.uploadType,
                    status: updatedUpload.status,
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update upload error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}