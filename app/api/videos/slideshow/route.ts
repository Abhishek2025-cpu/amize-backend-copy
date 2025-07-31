import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { createSlideshow, uploadSlideshowToS3 } from '@/utils/video-helper';

import { prisma } from '@/lib/prisma';

// Validation schema
const createSlideshowSchema = z.object({
    uploadIds: z.array(z.string().uuid()),
    title: z.string().optional(),
    description: z.string().optional(),
    soundId: z.string().uuid().optional(),
    slideDuration: z.number().min(1).max(10).default(3), // Duration per slide in seconds
    transition: z.enum(['fade', 'slide', 'zoom']).default('fade'),
    isPublic: z.boolean().default(true),
});

/**
 * Create a slideshow video from multiple images
 */
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

        // Parse request body
        const body = await request.json();

        // Validate request
        const validationResult = createSlideshowSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation error',
                    errors: validationResult.error.errors,
                },
                { status: 400 }
            );
        }

        const {
            uploadIds,
            title,
            description,
            soundId,
            slideDuration,
            transition,
            isPublic
        } = validationResult.data;

        // Verify all uploads exist, belong to the user, and are images
        const uploads = await prisma.upload.findMany({
            where: {
                id: { in: uploadIds },
                userId: authUser.userId,
                status: 'COMPLETED',
                fileType: { startsWith: 'image/' }
            },
        });

        if (uploads.length !== uploadIds.length) {
            const foundIds = uploads.map(u => u.id);
            const missingIds = uploadIds.filter(id => !foundIds.includes(id));

            return NextResponse.json(
                {
                    success: false,
                    message: 'Some uploads were not found or are not valid images',
                    missingIds
                },
                { status: 404 }
            );
        }

        // If soundId is provided, verify it exists
        let soundUrl = undefined;
        if (soundId) {
            const sound = await prisma.sound.findUnique({
                where: { id: soundId },
            });

            if (!sound) {
                return NextResponse.json(
                    { success: false, message: 'Sound not found' },
                    { status: 404 }
                );
            }

            soundUrl = sound.soundUrl;
        }

        // Create slideshow video
        const slideshowResult = await createSlideshow(
            uploadIds,
            authUser.userId,
            {
                duration: slideDuration,
                transition: transition,
                musicUrl: soundUrl
            }
        );

        // Upload the slideshow to S3
        const uploadResult = await uploadSlideshowToS3(
            slideshowResult.videoPath,
            authUser.userId
        );

        // Create a new upload record for the slideshow
        const slideshowUpload = await prisma.upload.create({
            data: {
                fileName: `slideshow-${Date.now()}.mp4`,
                originalFileName: title ? `${title}.mp4` : 'Slideshow.mp4',
                fileType: 'video/mp4',
                fileSize: 0, // Will be updated after processing
                fileUrl: uploadResult.url,
                fileKey: uploadResult.key,
                fileBucket: process.env.S3_BUCKET_NAME,
                uploadType: 'VIDEO',
                status: 'COMPLETED',
                user: {
                    connect: { id: authUser.userId }
                },
                width: slideshowResult.width,
                height: slideshowResult.height,
                duration: slideshowResult.duration,
            }
        });

        // Create the video record
        const video = await prisma.video.create({
            data: {
                title: title || 'Slideshow',
                description: description || '',
                videoUrl: uploadResult.url,
                duration: slideshowResult.duration,
                isPublic,
                sound: soundId ? { connect: { id: soundId } } : undefined,
                user: { connect: { id: authUser.userId } },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                    },
                },
                sound: {
                    select: {
                        id: true,
                        title: true,
                        artistName: true,
                    },
                },
            },
        });

        // Create metadata to track which images were used in this slideshow
        for (let i = 0; i < uploads.length; i++) {
            // You might want to create a new model in your schema to track this relationship
            // For now, we'll just log it
            console.log(`Slideshow ${video.id} uses image ${uploads[i].id} at position ${i}`);
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Slideshow created successfully',
                video,
                imageCount: uploads.length,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create slideshow error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error', error: (error as Error).message },
            { status: 500 }
        );
    }
}