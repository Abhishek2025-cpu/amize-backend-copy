import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const sendMessageSchema = z.object({
    content: z.string().min(1).max(1000),
    receiverId: z.string().uuid(),
    messageType: z.enum(['text', 'image', 'video', 'file']).default('text'),
    attachmentUrl: z.string().url().optional(),
    attachmentType: z.string().optional(),
    fileName: z.string().optional(),
    replyToId: z.string().uuid().optional(),
});

const getMessagesSchema = z.object({
    conversationId: z.string().uuid(),
    page: z.preprocess(
        (val) => (val ? parseInt(val as string) : 1),
        z.number().int().positive().default(1)
    ),
    limit: z.preprocess(
        (val) => (val ? parseInt(val as string) : 50),
        z.number().int().positive().max(100).default(50)
    ),
});

export async function POST(request: Request) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validationResult = sendMessageSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { success: false, message: 'Validation error', errors: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { content, receiverId, messageType, attachmentUrl, attachmentType, fileName, replyToId } = validationResult.data;

        // Check if receiver exists
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId }
        });

        if (!receiver) {
            return NextResponse.json(
                { success: false, message: 'Receiver not found' },
                { status: 404 }
            );
        }

        // Find or create conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                type: 'direct',
                participants: {
                    every: {
                        id: { in: [authUser.userId, receiverId] }
                    }
                }
            },
            include: {
                participants: true
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    type: 'direct',
                    participants: {
                        connect: [
                            { id: authUser.userId },
                            { id: receiverId }
                        ]
                    }
                },
                include: {
                    participants: true
                }
            });
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                content,
                messageType,
                attachmentUrl,
                attachmentType,
                fileName,
                replyToId,
                senderId: authUser.userId,
                receiverId,
                conversationId: conversation.id,
                isDelivered: true,
                deliveredAt: new Date(),
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                    }
                },
                replyTo: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                            }
                        }
                    }
                }
            }
        });

        // Update conversation last message
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageId: message.id,
                lastMessageContent: content,
                lastMessageAt: new Date(),
                lastMessageSender: authUser.userId,
            }
        });

        return NextResponse.json(
            { success: true, message: 'Message sent', data: message },
            { status: 201 }
        );

    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const queryResult = getMessagesSchema.safeParse(Object.fromEntries(searchParams.entries()));

        if (!queryResult.success) {
            return NextResponse.json(
                { success: false, message: 'Invalid query parameters' },
                { status: 400 }
            );
        }

        const { conversationId, page, limit } = queryResult.data;

        // Verify user is participant in conversation
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                participants: {
                    some: { id: authUser.userId }
                }
            }
        });

        if (!conversation) {
            return NextResponse.json(
                { success: false, message: 'Conversation not found' },
                { status: 404 }
            );
        }

        const skip = (page - 1) * limit;

        const messages = await prisma.message.findMany({
            where: {
                conversationId,
                isDeleted: false,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                    }
                },
                replyTo: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });

        const totalMessages = await prisma.message.count({
            where: {
                conversationId,
                isDeleted: false,
            }
        });

        return NextResponse.json({
            success: true,
            messages: messages.reverse(),
            pagination: {
                totalItems: totalMessages,
                totalPages: Math.ceil(totalMessages / limit),
                currentPage: page,
                limit,
            }
        });

    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}