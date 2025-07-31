import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

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
        const messageId = params.id;

        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return NextResponse.json(
                { success: false, message: 'Message not found' },
                { status: 404 }
            );
        }

        switch (action) {
            case 'mark_read':
                if (message.receiverId !== authUser.userId) {
                    return NextResponse.json(
                        { success: false, message: 'Not authorized to mark this message as read' },
                        { status: 403 }
                    );
                }

                const updatedMessage = await prisma.message.update({
                    where: { id: messageId },
                    data: {
                        isRead: true,
                        readAt: new Date(),
                    }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Message marked as read',
                    data: updatedMessage
                });

            case 'delete':
                if (message.senderId !== authUser.userId) {
                    return NextResponse.json(
                        { success: false, message: 'Not authorized to delete this message' },
                        { status: 403 }
                    );
                }

                await prisma.message.update({
                    where: { id: messageId },
                    data: {
                        isDeleted: true,
                        deletedAt: new Date(),
                    }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Message deleted'
                });

            default:
                return NextResponse.json(
                    { success: false, message: 'Invalid action' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Update message error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}