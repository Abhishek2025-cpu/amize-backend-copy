import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[Conversations API] Fetching conversations for user:', authUser.userId);

        // Fetch all conversations for the authenticated user with complete last message data
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { id: authUser.userId }
                },
                isActive: true, // Only active conversations
            },
            include: {
                participants: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                        isOnline: true,
                        lastSeenAt: true,
                    }
                },
                messages: {
                    where: {
                        isDeleted: false, // Exclude deleted messages
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1, // Get only the last message
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                profilePhotoUrl: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                lastMessageAt: 'desc'
            }
        });

        // Transform conversations to include proper last message data with unread counts
        const transformedConversations = await Promise.all(conversations.map(async (conversation) => {
            const lastMessage = conversation.messages[0]; // Most recent message

            // Calculate unread count for this user
            const unreadCount = await prisma.message.count({
                where: {
                    conversationId: conversation.id,
                    receiverId: authUser.userId,
                    isRead: false,
                    isDeleted: false,
                }
            });

            const transformedConversation = {
                id: conversation.id,
                type: conversation.type,
                title: conversation.title,
                description: conversation.description,
                imageUrl: conversation.imageUrl,
                isActive: conversation.isActive,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
                participants: conversation.participants,

                // Enhanced last message data
                lastMessageId: lastMessage?.id || null,
                lastMessageContent: lastMessage?.content || null,
                lastMessageAt: lastMessage?.createdAt || conversation.createdAt,
                lastMessageSender: lastMessage?.senderId || null,

                // Additional useful data
                lastMessage: lastMessage ? {
                    id: lastMessage.id,
                    content: lastMessage.content,
                    messageType: lastMessage.messageType,
                    createdAt: lastMessage.createdAt,
                    sender: lastMessage.sender,
                    senderId: lastMessage.senderId,
                    attachmentUrl: lastMessage.attachmentUrl,
                    fileName: lastMessage.fileName,
                } : null,

                // Include unread count
                unreadCount,
            };

            return transformedConversation;
        }));

        console.log('[Conversations API] Returning conversations:', transformedConversations.length);

        return NextResponse.json({
            success: true,
            conversations: transformedConversations
        });

    } catch (error) {
        console.error('[Conversations API] Error fetching conversations:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { participantId, type = 'direct', title, description } = await request.json();

        if (!participantId) {
            return NextResponse.json(
                { success: false, message: 'Participant ID is required' },
                { status: 400 }
            );
        }

        console.log('[Conversations API] Creating conversation:', { participantId, type });

        // Check if participant exists
        const participant = await prisma.user.findUnique({
            where: { id: participantId },
            select: { id: true, username: true, profilePhotoUrl: true }
        });

        if (!participant) {
            return NextResponse.json(
                { success: false, message: 'Participant not found' },
                { status: 404 }
            );
        }

        // For direct conversations, check if one already exists
        if (type === 'direct') {
            const existingConversation = await prisma.conversation.findFirst({
                where: {
                    type: 'direct',
                    AND: [
                        { participants: { some: { id: authUser.userId } } },
                        { participants: { some: { id: participantId } } }
                    ]
                },
                include: {
                    participants: {
                        select: {
                            id: true,
                            username: true,
                            profilePhotoUrl: true,
                            isOnline: true,
                            lastSeenAt: true,
                        }
                    }
                }
            });

            if (existingConversation) {
                console.log('[Conversations API] Found existing conversation:', existingConversation.id);
                return NextResponse.json({
                    success: true,
                    conversation: existingConversation
                });
            }
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                type,
                title,
                description,
                participants: {
                    connect: [
                        { id: authUser.userId },
                        { id: participantId }
                    ]
                }
            },
            include: {
                participants: {
                    select: {
                        id: true,
                        username: true,
                        profilePhotoUrl: true,
                        isOnline: true,
                        lastSeenAt: true,
                    }
                }
            }
        });

        console.log('[Conversations API] Created new conversation:', conversation.id);

        return NextResponse.json({
            success: true,
            conversation
        });

    } catch (error) {
        console.error('[Conversations API] Error creating conversation:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}