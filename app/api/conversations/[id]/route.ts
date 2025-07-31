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
                        profilePhotoUrl: true,
                        isOnline: true,
                        lastSeenAt: true,
                    }
                }
            }
        });

        if (!conversation) {
            return NextResponse.json(
                { success: false, message: 'Conversation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            conversation
        });

    } catch (error) {
        console.error('Get conversation error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { action } = await request.json();
        const conversationId = params.id;

        switch (action) {
            case 'mark_all_read':
                await prisma.message.updateMany({
                    where: {
                        conversationId,
                        receiverId: authUser.userId,
                        isRead: false,
                    },
                    data: {
                        isRead: true,
                        readAt: new Date(),
                    }
                });

                return NextResponse.json({
                    success: true,
                    message: 'All messages marked as read'
                });

            default:
                return NextResponse.json(
                    { success: false, message: 'Invalid action' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Update conversation error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}