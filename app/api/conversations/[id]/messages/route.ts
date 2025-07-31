import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const conversationId = params.id;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        console.log('[Messages API] Fetching messages for conversation:', {
            conversationId,
            userId: authUser.userId,
            page,
            limit
        });

        // Verify user has access to this conversation
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
                { success: false, message: 'Conversation not found or access denied' },
                { status: 404 }
            );
        }

        // Fetch messages with full details
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
            },
            orderBy: {
                createdAt: 'asc' // Oldest first for proper message order
            },
            skip: offset,
            take: limit,
        });

        // Get total count for pagination
        const totalCount = await prisma.message.count({
            where: {
                conversationId,
                isDeleted: false,
            }
        });

        console.log('[Messages API] Found messages:', {
            conversationId,
            count: messages.length,
            totalCount,
            page,
            hasMore: offset + messages.length < totalCount
        });

        // Transform messages to match the expected format
        const transformedMessages = messages.map(message => ({
            id: message.id,
            content: message.content,
            messageType: message.messageType,
            attachmentUrl: message.attachmentUrl,
            attachmentType: message.attachmentType,
            fileName: message.fileName,
            senderId: message.senderId,
            receiverId: message.receiverId,
            conversationId: message.conversationId,
            replyToId: message.replyToId,
            isDelivered: message.isDelivered,
            deliveredAt: message.deliveredAt?.toISOString(),
            isRead: message.isRead,
            readAt: message.readAt?.toISOString(),
            isDeleted: message.isDeleted,
            deletedAt: message.deletedAt?.toISOString(),
            createdAt: message.createdAt.toISOString(),
            updatedAt: message.updatedAt.toISOString(),
            sender: message.sender,
            receiver: message.receiver,
            replyTo: message.replyTo ? {
                ...message.replyTo,
                createdAt: message.replyTo.createdAt.toISOString(),
                updatedAt: message.replyTo.updatedAt.toISOString(),
                deliveredAt: message.replyTo.deliveredAt?.toISOString(),
                readAt: message.replyTo.readAt?.toISOString(),
                deletedAt: message.replyTo.deletedAt?.toISOString(),
            } : undefined,
        }));

        return NextResponse.json({
            success: true,
            messages: transformedMessages,
            pagination: {
                page,
                limit,
                totalCount,
                hasMore: offset + messages.length < totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('[Messages API] Error fetching messages:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const conversationId = params.id;
        const { content, messageType = 'text', attachmentUrl, attachmentType, fileName, replyToId } = await request.json();

        if (!content?.trim() && !attachmentUrl) {
            return NextResponse.json(
                { success: false, message: 'Message content or attachment required' },
                { status: 400 }
            );
        }

        console.log('[Messages API] Creating message:', {
            conversationId,
            senderId: authUser.userId,
            contentLength: content?.length || 0,
            messageType
        });

        // Verify user has access to this conversation and get receiver
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                participants: {
                    some: { id: authUser.userId }
                }
            },
            include: {
                participants: {
                    select: {
                        id: true,
                        username: true,
                    }
                }
            }
        });

        if (!conversation) {
            return NextResponse.json(
                { success: false, message: 'Conversation not found or access denied' },
                { status: 404 }
            );
        }

        // Find the receiver (other participant)
        const receiver = conversation.participants.find(p => p.id !== authUser.userId);
        if (!receiver) {
            return NextResponse.json(
                { success: false, message: 'Receiver not found in conversation' },
                { status: 400 }
            );
        }

        // Create the message
        const message = await prisma.message.create({
            data: {
                content: content?.trim() || '',
                messageType,
                attachmentUrl,
                attachmentType,
                fileName,
                replyToId,
                senderId: authUser.userId,
                receiverId: receiver.id,
                conversationId,
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
            where: { id: conversationId },
            data: {
                lastMessageId: message.id,
                lastMessageContent: content?.trim() || '[Attachment]',
                lastMessageAt: new Date(),
                lastMessageSender: authUser.userId,
            }
        });

        console.log('[Messages API] Message created successfully:', message.id);

        // Transform message to match expected format
        const transformedMessage = {
            id: message.id,
            content: message.content,
            messageType: message.messageType,
            attachmentUrl: message.attachmentUrl,
            attachmentType: message.attachmentType,
            fileName: message.fileName,
            senderId: message.senderId,
            receiverId: message.receiverId,
            conversationId: message.conversationId,
            replyToId: message.replyToId,
            isDelivered: message.isDelivered,
            deliveredAt: message.deliveredAt?.toISOString(),
            isRead: message.isRead,
            readAt: message.readAt?.toISOString(),
            isDeleted: message.isDeleted,
            deletedAt: message.deletedAt?.toISOString(),
            createdAt: message.createdAt.toISOString(),
            updatedAt: message.updatedAt.toISOString(),
            sender: message.sender,
            receiver: message.receiver,
            replyTo: message.replyTo ? {
                ...message.replyTo,
                createdAt: message.replyTo.createdAt.toISOString(),
                updatedAt: message.replyTo.updatedAt.toISOString(),
                deliveredAt: message.replyTo.deliveredAt?.toISOString(),
                readAt: message.replyTo.readAt?.toISOString(),
                deletedAt: message.replyTo.deletedAt?.toISOString(),
            } : undefined,
        };

        return NextResponse.json({
            success: true,
            message: transformedMessage
        });

    } catch (error) {
        console.error('[Messages API] Error creating message:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}