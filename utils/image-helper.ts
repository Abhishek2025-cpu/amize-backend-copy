;
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
    getFileFromS3,
    uploadToS3,
    generateS3Key
} from '@/lib/services/s3Service';

const execAsync = promisify(exec);
import { prisma } from '@/lib/prisma';

/**
 * Process an image after upload (resize, optimize, extract metadata)
 * @param uploadId The ID of the upload to process
 */
export async function processImage(uploadId: string): Promise<void> {
    try {
        // Get the upload record
        const upload = await prisma.upload.findUnique({
            where: { id: uploadId }
        });

        if (!upload) {
            throw new Error(`Upload not found: ${uploadId}`);
        }

        // Mark as processing
        await prisma.upload.update({
            where: { id: uploadId },
            data: { status: 'PROCESSING' }
        });

        // Create temporary directory
        const tempDir = path.join(os.tmpdir(), 'image-processing');
        await ensureDirectoryExists(tempDir);

        // Download file from S3 to temp directory
        const imageBuffer = await getFileFromS3(upload.fileKey);
        const imagePath = path.join(tempDir, `${uuidv4()}${path.extname(upload.fileName)}`);
        await writeFile(imagePath, imageBuffer);

        // Process image based on upload type
        if (upload.uploadType === 'PROFILE_PHOTO') {
            // Resize and optimize profile photo
            await optimizeProfilePhoto(imagePath, upload.userId);
        } else {
            // For other image types, just extract dimensions
            const dimensions = await getImageDimensions(imagePath);

            // Update upload record with metadata
            await prisma.upload.update({
                where: { id: uploadId },
                data: {
                    width: dimensions.width,
                    height: dimensions.height,
                    status: 'COMPLETED'
                }
            });
        }

        // Clean up temp files
        try {
            await unlink(imagePath);
        } catch (err) {
            console.error('Error deleting temp image file:', err);
            // Non-critical error, continue execution
        }

        console.log(`Successfully processed image: ${uploadId}`);
    } catch (error) {
        console.error(`Error processing image ${uploadId}:`, error);

        // Update upload record with error
        await prisma.upload.update({
            where: { id: uploadId },
            data: {
                status: 'FAILED',
                processingError: (error as Error).message
            }
        });
    }
}

/**
 * Optimize profile photo (resize to standard dimensions)
 */
async function optimizeProfilePhoto(
    imagePath: string,
    userId: string
): Promise<void> {
    try {
        // Get original dimensions
        const originalDimensions = await getImageDimensions(imagePath);

        // Create paths for optimized versions
        const tempDir = path.dirname(imagePath);
        const fileName = path.basename(imagePath);
        const optimizedPath = path.join(tempDir, `optimized_${fileName}`);

        // Resize to standard profile photo size (maintaining aspect ratio)
        await execAsync(`convert "${imagePath}" -resize 500x500^ -gravity center -extent 500x500 "${optimizedPath}"`);

        // Read the optimized file
        const fs = require('fs').promises;
        const optimizedBuffer = await fs.readFile(optimizedPath);

        // Upload optimized version back to S3 (replacing the original)
        const s3Key = generateS3Key(userId, 'profile_photos', fileName);

        await uploadToS3({
            file: optimizedBuffer,
            key: s3Key,
            contentType: 'image/jpeg',
            isPublic: true,
        });

        // Clean up temp files
        await unlink(optimizedPath);

        // Get new dimensions
        const dimensions = await getImageDimensions(optimizedPath);

        // Find the upload by fileKey first, then update by ID
        const upload = await prisma.upload.findFirst({
            where: { fileKey: s3Key }
        });

        if (upload) {
            await prisma.upload.update({
                where: { id: upload.id },
                data: {
                    width: dimensions.width || 500,
                    height: dimensions.height || 500,
                    status: 'COMPLETED'
                }
            });
        } else {
            console.error(`Upload record with fileKey ${s3Key} not found`);
        }
    } catch (error) {
        console.error('Error optimizing profile photo:', error);
        throw error;
    }
}

/**
 * Get image dimensions
 */
async function getImageDimensions(imagePath: string): Promise<{ width?: number; height?: number }> {
    try {
        const { stdout } = await execAsync(`identify -format "%wx%h" "${imagePath}"`);
        const [width, height] = stdout.trim().split('x').map(Number);
        return { width, height };
    } catch (error) {
        console.error('Error getting image dimensions:', error);
        return {};
    }
}

/**
 * Ensure a directory exists
 */
async function ensureDirectoryExists(directory: string) {
    if (!existsSync(directory)) {
        await mkdir(directory, { recursive: true });
    }
}