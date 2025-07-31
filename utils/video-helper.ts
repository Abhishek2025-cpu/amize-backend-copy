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
 * Process a video after upload (generate thumbnail, extract metadata)
 * @param uploadId The ID of the upload to process
 */
export async function processVideo(uploadId: string): Promise<void> {
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

        // Create temporary directories
        const tempDir = path.join(os.tmpdir(), 'video-processing');
        await ensureDirectoryExists(tempDir);

        // Download file from S3 to temp directory
        const videoBuffer = await getFileFromS3(upload.fileKey);
        const videoPath = path.join(tempDir, `${uuidv4()}${path.extname(upload.fileName)}`);
        await writeFile(videoPath, videoBuffer);

        // Process video (extract metadata)
        const dimensions = await getVideoDimensions(videoPath);

        // Generate thumbnail
        const thumbnailResult = await generateThumbnail(videoPath, upload.userId);

        // Clean up temp video file
        try {
            await unlink(videoPath);
        } catch (err) {
            console.error('Error deleting temp video file:', err);
            // Non-critical error, continue execution
        }

        // Update upload record with metadata
        await prisma.upload.update({
            where: { id: uploadId },
            data: {
                width: dimensions.width,
                height: dimensions.height,
                duration: dimensions.duration,
                thumbnailUrl: thumbnailResult?.url || null,
                status: 'COMPLETED'
            }
        });

        console.log(`Successfully processed video: ${uploadId}`);
    } catch (error) {
        console.error(`Error processing video ${uploadId}:`, error);

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
 * Create a slideshow video from multiple images
 * @param uploadIds Array of image upload IDs
 * @param userId User ID
 * @param options Options for the slideshow (duration per slide, etc)
 */
export async function createSlideshow(
    uploadIds: string[],
    userId: string,
    options: {
        duration?: number;       // Duration per slide in seconds
        transition?: string;     // Transition type
        musicUrl?: string;       // Background music URL
    } = {}
): Promise<{ videoPath: string; duration: number; width: number; height: number }> {
    try {
        // Set defaults
        const slideDuration = options.duration || 3;  // 3 seconds per slide
        const transition = options.transition || 'fade';

        // Create temporary directories
        const tempDir = path.join(os.tmpdir(), 'slideshow-creation');
        await ensureDirectoryExists(tempDir);

        // Get all uploads
        const uploads = await prisma.upload.findMany({
            where: {
                id: { in: uploadIds },
                userId,
                status: 'COMPLETED'
            }
        });

        if (uploads.length === 0) {
            throw new Error('No valid uploads found for slideshow creation');
        }

        // Download all images to temp directory
        const imageFiles = [];
        for (let i = 0; i < uploads.length; i++) {
            const upload = uploads[i];
            const imgBuffer = await getFileFromS3(upload.fileKey);
            const imgPath = path.join(tempDir, `slide_${i}${path.extname(upload.fileName)}`);
            await writeFile(imgPath, imgBuffer);
            imageFiles.push(imgPath);
        }

        // Prepare FFmpeg command for slideshow creation
        const outputVideoPath = path.join(tempDir, `${uuidv4()}.mp4`);

        // Create FFmpeg command - basic version
        // For a more advanced version, you would need to create complex filter chains
        let ffmpegCommand = `ffmpeg`;

        // Add input files
        for (const imgPath of imageFiles) {
            ffmpegCommand += ` -loop 1 -t ${slideDuration} -i "${imgPath}"`;
        }

        // Add music if provided
        if (options.musicUrl) {
            // Download the music file
            const musicBuffer = await getFileFromS3(options.musicUrl);
            const musicPath = path.join(tempDir, `music.mp3`);
            await writeFile(musicPath, musicBuffer);
            ffmpegCommand += ` -i "${musicPath}"`;
        }

        // Add filter complex for the slideshow
        // This is a basic concatenation - more advanced transitions require more complex filters
        ffmpegCommand += ` -filter_complex "`;

        // Create segments for each image
        for (let i = 0; i < imageFiles.length; i++) {
            ffmpegCommand += `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[v${i}];`;
        }

        // Concatenate all video segments
        ffmpegCommand += ``;
        for (let i = 0; i < imageFiles.length; i++) {
            ffmpegCommand += `[v${i}]`;
        }
        ffmpegCommand += `concat=n=${imageFiles.length}:v=1:a=0[outv]`;

        // If we have music, add audio handling
        if (options.musicUrl) {
            ffmpegCommand += `;[${imageFiles.length}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,apad[outa]`;
        }

        ffmpegCommand += `"`;

        // Map outputs
        ffmpegCommand += ` -map "[outv]"`;
        if (options.musicUrl) {
            ffmpegCommand += ` -map "[outa]" -shortest`;
        }

        // Set codec options
        ffmpegCommand += ` -c:v libx264 -pix_fmt yuv420p -r 30 -preset medium -crf 23`;
        if (options.musicUrl) {
            ffmpegCommand += ` -c:a aac -b:a 128k`;
        }

        // Output file
        ffmpegCommand += ` "${outputVideoPath}"`;

        // Execute FFmpeg command
        await execAsync(ffmpegCommand);

        // Get metadata of the created video
        const { width, height, duration } = await getVideoDimensions(outputVideoPath);

        // Clean up image files
        for (const imgPath of imageFiles) {
            try {
                await unlink(imgPath);
            } catch (err) {
                console.error('Error removing temp image:', err);
            }
        }

        return {
            videoPath: outputVideoPath,
            duration: duration || imageFiles.length * slideDuration,
            width: width || 1920,
            height: height || 1080
        };
    } catch (error) {
        console.error('Error creating slideshow:', error);
        throw new Error(`Failed to create slideshow: ${(error as Error).message}`);
    }
}

/**
 * Generate a video thumbnail
 */
async function generateThumbnail(
    videoPath: string,
    userId: string
): Promise<{ url: string; key: string } | null> {
    try {
        // Create temp output path
        const tempDir = path.join(os.tmpdir(), 'thumbnails');
        await ensureDirectoryExists(tempDir);

        const thumbnailFileName = `${uuidv4()}.jpg`;
        const thumbnailPath = path.join(tempDir, thumbnailFileName);

        // Generate thumbnail using FFmpeg
        await execAsync(`ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 "${thumbnailPath}"`);

        // Read file into buffer
        const fs = require('fs').promises;
        const thumbnailBuffer = await fs.readFile(thumbnailPath);

        // Upload thumbnail to S3
        const s3Key = generateS3Key(userId, 'thumbnails', thumbnailFileName);

        const uploadResult = await uploadToS3({
            file: thumbnailBuffer,
            key: s3Key,
            contentType: 'image/jpeg',
            isPublic: true,
        });

        // Clean up the temporary file
        await unlink(thumbnailPath);

        return {
            url: uploadResult.url,
            key: s3Key
        };
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return null;
    }
}

/**
 * Get video dimensions and duration
 */
async function getVideoDimensions(
    videoPath: string
): Promise<{ width?: number; height?: number; duration?: number }> {
    try {
        // Get dimensions
        const { stdout: dimensionsOutput } = await execAsync(
            `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`
        );
        const [width, height] = dimensionsOutput.trim().split('x').map(Number);

        // Get duration
        const { stdout: durationOutput } = await execAsync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
        );
        const duration = parseFloat(durationOutput.trim());

        return { width, height, duration };
    } catch (error) {
        console.error('Error getting video dimensions:', error);
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

/**
 * Upload a slideshow video to S3
 * @param videoPath Path to the temporary video file
 * @param userId User ID
 */
export async function uploadSlideshowToS3(videoPath: string, userId: string): Promise<{ url: string; key: string }> {
    try {
        // Read the file into a buffer
        const fs = require('fs').promises;
        const videoBuffer = await fs.readFile(videoPath);

        // Generate a unique key for S3
        const fileName = `slideshow-${uuidv4()}.mp4`;
        const s3Key = generateS3Key(userId, 'videos', fileName);

        // Upload to S3
        const uploadResult = await uploadToS3({
            file: videoBuffer,
            key: s3Key,
            contentType: 'video/mp4',
            metadata: {
                userId,
                originalFileName: fileName,
                uploadType: 'VIDEO',
                isSlideshow: 'true'
            },
            isPublic: true,
        });

        // Clean up temp file
        try {
            await unlink(videoPath);
        } catch (err) {
            console.error('Error removing temp video file:', err);
            // Non-critical error, continue execution
        }

        return {
            url: uploadResult.url,
            key: s3Key
        };
    } catch (error) {
        console.error('Error uploading slideshow to S3:', error);
        throw new Error(`Failed to upload slideshow to S3: ${(error as Error).message}`);
    }
}