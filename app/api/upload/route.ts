/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a file (image, video, sound)
 *     description: >
 *       Uploads a file to the server and creates an Upload record in the database.
 *       Handles various file types including images, videos, and audio.
 *     tags:
 *       - Uploads
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
 *               - uploadType
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               uploadType:
 *                 type: string
 *                 enum: [PROFILE_PHOTO, VIDEO, THUMBNAIL, SOUND, OTHER]
 *                 description: Type of upload
 *     responses:
 *       201:
 *         description: File uploaded successfully
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
 *                   example: File uploaded successfully
 *                 upload:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fileName:
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
 *                   example: Invalid file type or missing required fields
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
 *       413:
 *         description: File too large
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
 *                   example: File size exceeds the limit
 *       415:
 *         description: Unsupported media type
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
 *                   example: Unsupported file type
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
 *   get:
 *     summary: Get list of user's uploads
 *     description: >
 *       Retrieves a list of the authenticated user's uploads with optional filtering.
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: uploadType
 *         schema:
 *           type: string
 *           enum: [PROFILE_PHOTO, VIDEO, THUMBNAIL, SOUND, OTHER]
 *         description: Filter by upload type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PROCESSING, COMPLETED, FAILED]
 *         description: Filter by upload status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of uploads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 uploads:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       fileUrl:
 *                         type: string
 *                       fileType:
 *                         type: string
 *                       fileSize:
 *                         type: integer
 *                       uploadType:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
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
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import path from 'path';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import {
    uploadToS3,
    generateS3Key,
    getPublicUrl,
    deleteFromS3
} from '@/lib/services/s3Service';

const execAsync = promisify(exec);
import { prisma } from '@/lib/prisma';

// Configuration
const MAX_FILE_SIZE = {
    VIDEO: 100 * 1024 * 1024, // 100MB
    PROFILE_PHOTO: 5 * 1024 * 1024, // 5MB
    THUMBNAIL: 5 * 1024 * 1024, // 5MB
    SOUND: 10 * 1024 * 1024, // 10MB
    OTHER: 20 * 1024 * 1024, // 20MB
};

const ALLOWED_FILE_TYPES = {
    VIDEO: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    PROFILE_PHOTO: ['image/jpeg', 'image/png', 'image/webp'],
    THUMBNAIL: ['image/jpeg', 'image/png', 'image/webp'],
    SOUND: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    OTHER: ['application/pdf', 'application/zip'],
};

// Helper functions
async function ensureDirectoryExists(directory: string) {
    if (!existsSync(directory)) {
        await mkdir(directory, { recursive: true });
    }
}

async function getMediaDimensions(filePath: string, fileType: string): Promise<{ width?: number; height?: number; duration?: number }> {
    try {
        if (fileType.startsWith('image/')) {
            // For images, use ImageMagick's identify
            const { stdout } = await execAsync(`identify -format "%wx%h" "${filePath}"`);
            const [width, height] = stdout.trim().split('x').map(Number);
            return { width, height };
        } else if (fileType.startsWith('video/')) {
            // For videos, use FFmpeg to get dimensions and duration
            const { stdout } = await execAsync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${filePath}"`);
            const [width, height] = stdout.trim().split('x').map(Number);

            // Get duration
            const durationResult = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
            const duration = parseFloat(durationResult.stdout.trim());

            return { width, height, duration };
        } else if (fileType.startsWith('audio/')) {
            // For audio, use FFmpeg to get duration
            const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
            const duration = parseFloat(stdout.trim());
            return { duration };
        }

        return {};
    } catch (error) {
        console.error('Error getting media dimensions:', error);
        return {};
    }
}

async function generateThumbnail(filePath: string): Promise<{ buffer: Buffer, fileName: string } | null> {
    try {
        // Create temp directory and output path
        const tempDir = path.join(os.tmpdir(), 'thumbnails');
        await ensureDirectoryExists(tempDir);

        const thumbnailFileName = `${uuidv4()}.jpg`;
        const thumbnailPath = path.join(tempDir, thumbnailFileName);

        // Generate thumbnail using FFmpeg
        await execAsync(`ffmpeg -i "${filePath}" -ss 00:00:01 -vframes 1 "${thumbnailPath}"`);

        // Read the thumbnail into a buffer
        const fs = require('fs').promises;
        const thumbnailBuffer = await fs.readFile(thumbnailPath);

        // Clean up the temporary file
        await unlink(thumbnailPath);

        return {
            buffer: thumbnailBuffer,
            fileName: thumbnailFileName
        };
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return null;
    }
}

// Validation schemas
const uploadQuerySchema = z.object({
    uploadType: z.enum(['PROFILE_PHOTO', 'VIDEO', 'THUMBNAIL', 'SOUND', 'OTHER']).optional(),
    status: z.enum(['PROCESSING', 'COMPLETED', 'FAILED']).optional(),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

// API Routes
export async function POST(request: Request) {
    try {
        // Check authentication
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse the multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const uploadTypeStr = formData.get('uploadType') as string;

        // Validate required fields
        if (!file || !uploadTypeStr) {
            return NextResponse.json(
                { success: false, message: 'File and uploadType are required' },
                { status: 400 }
            );
        }

        // Validate upload type
        const uploadType = uploadTypeStr as UploadType;
        if (!Object.keys(UploadType).includes(uploadType)) {
            return NextResponse.json(
                { success: false, message: 'Invalid upload type' },
                { status: 400 }
            );
        }

        // Validate file size
        const maxSize = MAX_FILE_SIZE[uploadType];
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, message: `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB` },
                { status: 413 }
            );
        }

        // Validate file type
        const fileType = file.type;
        const allowedTypes = ALLOWED_FILE_TYPES[uploadType];
        if (!allowedTypes.includes(fileType)) {
            return NextResponse.json(
                { success: false, message: `Unsupported file type. Allowed types: ${allowedTypes.join(', ')}` },
                { status: 415 }
            );
        }

        // Get file buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const originalFileName = file.name;

        // Create a temporary local file for processing (metadata extraction, thumbnails)
        const tempDir = path.join(os.tmpdir(), 'uploads');
        await ensureDirectoryExists(tempDir);

        const tempFilePath = path.join(tempDir, originalFileName);
        await writeFile(tempFilePath, fileBuffer);

        // Generate a unique key for S3
        const fileName = `${uuidv4()}${path.extname(originalFileName)}`;
        const s3Key = generateS3Key(authUser.userId, uploadType.toLowerCase(), fileName);
        const bucketName = process.env.S3_BUCKET_NAME || 'amize-uploads';

        // Upload to S3
        const uploadResult = await uploadToS3({
            file: fileBuffer,
            key: s3Key,
            contentType: fileType,
            metadata: {
                userId: authUser.userId,
                originalFileName,
                uploadType,
            },
            //isPublic: true,
        });

        // Get dimensions and other metadata from the temp file
        let dimensions = {};
        let thumbnailUrl: string | null = null;
        let thumbnailKey: string | null = null;

        // For videos, generate thumbnail and get dimensions
        if (uploadType === 'VIDEO') {
            // Generate thumbnail
            const thumbnail = await generateThumbnail(tempFilePath);

            if (thumbnail) {
                // Upload thumbnail to S3
                const thumbnailKey = generateS3Key(
                    authUser.userId,
                    'thumbnails',
                    thumbnail.fileName
                );

                const thumbnailResult = await uploadToS3({
                    file: thumbnail.buffer,
                    key: thumbnailKey,
                    contentType: 'image/jpeg',
                    //isPublic: true,
                });

                thumbnailUrl = thumbnailResult.url;
            }

            // Get dimensions and duration
            dimensions = await getMediaDimensions(tempFilePath, fileType);
        }
        // For images and sounds, get dimensions/duration
        else if (['PROFILE_PHOTO', 'THUMBNAIL'].includes(uploadType)) {
            dimensions = await getMediaDimensions(tempFilePath, fileType);
        } else if (uploadType === 'SOUND') {
            dimensions = await getMediaDimensions(tempFilePath, fileType);
        }

        // Clean up temporary file
        try {
            await unlink(tempFilePath);
        } catch (err) {
            console.error('Error removing temp file:', err);
            // Non-critical error, continue execution
        }

        // Create upload record in database
        const upload = await prisma.upload.create({
            data: {
                fileName,
                originalFileName,
                fileType,
                fileSize: file.size,
                fileUrl: uploadResult.url,
                fileKey: s3Key, // Store S3 key instead of local path
                fileBucket: bucketName, // Store bucket name
                uploadType,
                status: 'COMPLETED',
                user: {
                    connect: { id: authUser.userId }
                },
                ...dimensions,
                thumbnailUrl,
            }
        });

        return NextResponse.json(
            {
                success: true,
                message: 'File uploaded successfully',
                upload: {
                    id: upload.id,
                    fileName: upload.fileName,
                    originalFileName: upload.originalFileName,
                    fileUrl: upload.fileUrl,
                    fileType: upload.fileType,
                    fileSize: upload.fileSize,
                    uploadType: upload.uploadType,
                    status: upload.status,
                    thumbnailUrl: upload.thumbnailUrl,
                    width: upload.width,
                    height: upload.height,
                    duration: upload.duration,
                    createdAt: upload.createdAt,
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error', error: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        // Check authentication
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const queryResult = uploadQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

        if (!queryResult.success) {
            return NextResponse.json(
                { success: false, message: 'Invalid query parameters', errors: queryResult.error.errors },
                { status: 400 }
            );
        }

        const { uploadType, status, page, limit } = queryResult.data;

        // Build filter
        const filter: any = {
            userId: authUser.userId
        };

        if (uploadType) {
            filter.uploadType = uploadType;
        }

        if (status) {
            filter.status = status;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalItems = await prisma.upload.count({
            where: filter
        });

        // Fetch uploads
        const uploads = await prisma.upload.findMany({
            where: filter,
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit,
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / limit);

        return NextResponse.json(
            {
                success: true,
                uploads: uploads.map(upload => ({
                    id: upload.id,
                    fileName: upload.fileName,
                    originalFileName: upload.originalFileName,
                    fileUrl: upload.fileUrl,
                    fileType: upload.fileType,
                    fileSize: upload.fileSize,
                    uploadType: upload.uploadType,
                    status: upload.status,
                    thumbnailUrl: upload.thumbnailUrl,
                    width: upload.width,
                    height: upload.height,
                    duration: upload.duration,
                    createdAt: upload.createdAt,
                })),
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit,
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get uploads error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}