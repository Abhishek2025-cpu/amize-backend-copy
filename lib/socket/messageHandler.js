import { getUserFromSocket, requireAuth } from './auth.js';
import { notificationManager } from './notificationHandler.js';
import { connectionManager } from './connectionManager.js';
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient()

export function setupMessageHandlers(socket, io) {
    const user = getUserFromSocket(socket);

    // Enhanced connection handling with immediate verification
    if (user) {
        // Join user to their personal room immediately
        socket.join(`user:${user.userId}`);
        console.log(`🏠 [MessageHandler] User ${user.username} joined personal room: user:${user.userId}`);

        // CRITICAL: Ensure ConnectionManager knows about this connection immediately
        connectionManager.handleConnection(socket, io).then(() => {
            // Verify the user is tracked as online
            const isOnline = connectionManager.isUserOnline(user.userId);
            console.log(`✅ [MessageHandler] Connection verification for ${user.username}: online=${isOnline}`);

            if (!isOnline) {
                console.error(`❌ [MessageHandler] CRITICAL: User ${user.username} not showing as online after connection setup!`);
                connectionManager.logDebugState(user.userId);
            }
        }).catch(error => {
            console.error('❌ [MessageHandler] Error in connection setup:', error);
        });

        // Update user online status and broadcast
        console.log(`📡 [MessageHandler] Broadcasting user online: ${user.username}`);

        // Broadcast to ALL other connected sockets that this user is online
        socket.broadcast.emit('user_online', {
            userId: user.userId,
            username: user.username,
            onlineAt: new Date().toISOString()
        });

        // Also emit to the user's own socket (for multi-device scenarios)
        socket.emit('user_online', {
            userId: user.userId,
            username: user.username,
            onlineAt: new Date().toISOString()
        });
    }

    socket.on('send_message', async (data, callback) => {
        console.log('📨 [MessageHandler] Received send_message event:', data);

        if (!requireAuth(socket, (error) => {
            console.error('❌ [MessageHandler] Auth failed:', error);
            callback?.({ success: false, error });
        })) {
            return;
        }

        const user = getUserFromSocket(socket);
        if (!user) {
            console.error('❌ [MessageHandler] No user found in socket');
            callback?.({ success: false, error: 'Authentication required' });
            return;
        }

        try {
            const {
                content,
                receiverId,
                conversationId,
                messageType = 'text',
                attachmentUrl,
                attachmentType,
                fileName,
                replyToId
            } = data;

            console.log('📨 [MessageHandler] Processing message:', {
                from: user.userId,
                fromUsername: user.username,
                to: receiverId,
                conversationId,
                contentLength: content?.length || 0,
                messageType,
                timestamp: new Date().toISOString()
            });

            // Validate required fields
            if (!content?.trim() && !attachmentUrl) {
                console.error('❌ [MessageHandler] No content or attachment');
                callback?.({ success: false, error: 'Message content or attachment required' });
                return;
            }

            if (!receiverId) {
                console.error('❌ [MessageHandler] No receiver ID');
                callback?.({ success: false, error: 'Receiver ID required' });
                return;
            }

            // Check if receiver exists
            const receiver = await prisma.user.findUnique({
                where: { id: receiverId },
                select: { id: true, username: true, profilePhotoUrl: true }
            });

            if (!receiver) {
                console.error('❌ [MessageHandler] Receiver not found:', receiverId);
                callback?.({ success: false, error: 'Receiver not found' });
                return;
            }

            console.log(`✅ [MessageHandler] Receiver found: ${receiver.username} (${receiver.id})`);

            // Enhanced online status logging for receiver
            const receiverOnlineStatus = connectionManager.isUserOnline(receiverId);
            const receiverConnections = connectionManager.getUserConnections(receiverId);
            console.log(`🔍 [MessageHandler] Receiver ${receiver.username} status:`, {
                online: receiverOnlineStatus,
                connections: receiverConnections.size,
                connectionIds: Array.from(receiverConnections)
            });

            // Find or create conversation
            let conversation;
            if (conversationId) {
                conversation = await prisma.conversation.findFirst({
                    where: {
                        id: conversationId,
                        participants: {
                            some: { id: user.userId }
                        }
                    },
                    include: {
                        participants: {
                            select: {
                                id: true,
                                username: true,
                                profilePhotoUrl: true
                            }
                        }
                    }
                });
                console.log('🔍 [MessageHandler] Found existing conversation by ID:', !!conversation);
            }

            if (!conversation) {
                // Look for existing direct conversation between these two users
                conversation = await prisma.conversation.findFirst({
                    where: {
                        type: 'direct',
                        AND: [
                            { participants: { some: { id: user.userId } } },
                            { participants: { some: { id: receiverId } } }
                        ]
                    },
                    include: {
                        participants: {
                            select: {
                                id: true,
                                username: true,
                                profilePhotoUrl: true
                            }
                        }
                    }
                });

                console.log('🔍 [MessageHandler] Found existing direct conversation:', !!conversation);

                if (!conversation) {
                    // Create new conversation
                    console.log('🆕 [MessageHandler] Creating new conversation');
                    conversation = await prisma.conversation.create({
                        data: {
                            type: 'direct',
                            participants: {
                                connect: [
                                    { id: user.userId },
                                    { id: receiverId }
                                ]
                            }
                        },
                        include: {
                            participants: {
                                select: {
                                    id: true,
                                    username: true,
                                    profilePhotoUrl: true
                                }
                            }
                        }
                    });
                    console.log('✅ [MessageHandler] Created new conversation:', conversation.id);
                }
            }

            // Create message
            console.log('💾 [MessageHandler] Creating message in conversation:', conversation.id);
            const message = await prisma.message.create({
                data: {
                    content: content?.trim() || '',
                    messageType,
                    attachmentUrl,
                    attachmentType,
                    fileName,
                    replyToId,
                    senderId: user.userId,
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

            console.log('✅ [MessageHandler] Message created:', message.id);

            // Update conversation last message
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    lastMessageId: message.id,
                    lastMessageContent: content?.trim() || '[Attachment]',
                    lastMessageAt: new Date(),
                    lastMessageSender: user.userId,
                }
            });

            console.log('✅ [MessageHandler] Updated conversation last message');

            // Prepare message data for broadcasting
            const messageData = {
                id: message.id,
                content: message.content,
                messageType: message.messageType,
                attachmentUrl: message.attachmentUrl,
                attachmentType: message.attachmentType,
                fileName: message.fileName,
                senderId: message.senderId,
                receiverId: message.receiverId,
                conversationId: message.conversationId,
                createdAt: message.createdAt,
                isDelivered: message.isDelivered,
                isRead: message.isRead,
                sender: message.sender,
                receiver: message.receiver,
                replyTo: message.replyTo
            };

            // Enhanced broadcasting with detailed logging
            console.log('📡 [MessageHandler] Broadcasting message to both users');

            // Send to receiver
            console.log(`📤 [MessageHandler] Sending to receiver room: user:${receiverId}`);
            const receiverEmitResult = io.to(`user:${receiverId}`).emit('message_received', {
                message: messageData,
                conversationId: conversation.id
            });

            // Send to sender (for confirmation and multi-device sync)
            console.log(`📤 [MessageHandler] Sending to sender room: user:${user.userId}`);
            const senderEmitResult = io.to(`user:${user.userId}`).emit('message_received', {
                message: messageData,
                conversationId: conversation.id
            });

            // Also broadcast to conversation room if users are in it
            console.log(`📤 [MessageHandler] Broadcasting to conversation room: conversation:${conversation.id}`);
            const conversationEmitResult = io.to(`conversation:${conversation.id}`).emit('message_received', {
                message: messageData,
                conversationId: conversation.id
            });

            // Enhanced notification handling with detailed logging
            console.log('🔔 [MessageHandler] Processing message notification for receiver...');

            // Always send message notifications (priority notifications bypass online checks)
            console.log(`🔔 [MessageHandler] Sending message notification: ${user.username} -> ${receiver.username}`);

            // Enhanced logging before notification
            console.log('🔍 [MessageHandler] Pre-notification state check:', {
                receiverId,
                receiverUsername: receiver.username,
                senderUsername: user.username,
                connectionManagerOnline: connectionManager.isUserOnline(receiverId),
                messageContent: message.content?.substring(0, 50) + '...'
            });

            // Send message notification asynchronously with enhanced logging
            notificationManager.sendMessageNotification(
                receiverId,
                user.userId,
                message.content || '[Attachment]'
            ).then((notification) => {
                if (notification) {
                    console.log(`✅ [MessageHandler] Message notification sent successfully: ${notification.id}`);
                    console.log('🔍 [MessageHandler] Notification details:', {
                        notificationId: notification.id,
                        type: notification.type,
                        message: notification.message,
                        createdAt: notification.createdAt
                    });
                } else {
                    console.log(`⚠️ [MessageHandler] Message notification not sent (user settings or other reason)`);
                }
            }).catch((error) => {
                console.error(`❌ [MessageHandler] Error sending message notification:`, error);
                console.error('❌ [MessageHandler] Notification error stack:', error.stack);
            });

            // Broadcast conversation update
            const conversationUpdate = {
                id: conversation.id,
                type: conversation.type,
                lastMessageContent: message.content || '[Attachment]',
                lastMessageAt: message.createdAt,
                lastMessageSender: user.userId,
                participants: conversation.participants
            };

            // Send conversation update to both users
            console.log('📡 [MessageHandler] Broadcasting conversation updates');
            io.to(`user:${receiverId}`).emit('conversation_updated', conversationUpdate);
            io.to(`user:${user.userId}`).emit('conversation_updated', conversationUpdate);

            console.log('✅ [MessageHandler] Message sent successfully');

            // Enhanced callback response
            callback?.({
                success: true,
                messageId: message.id,
                message: messageData,
                conversation: conversationUpdate,
                timestamp: new Date().toISOString(),
                deliveryInfo: {
                    receiverOnline: receiverOnlineStatus,
                    receiverConnections: receiverConnections.size,
                    notificationQueued: true
                }
            });

        } catch (error) {
            console.error('❌ [MessageHandler] Send message error:', error);
            console.error('❌ [MessageHandler] Error stack:', error.stack);
            callback?.({
                success: false,
                error: 'Failed to send message',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Enhanced typing handlers with better logging
    socket.on('typing_start', (data) => {
        console.log('⌨️ [MessageHandler] Received typing_start:', data);

        if (!requireAuth(socket)) return;

        const user = getUserFromSocket(socket);
        if (!user) return;

        const { conversationId, receiverId } = data;

        if (!conversationId || !receiverId) {
            console.error('❌ [MessageHandler] Missing conversationId or receiverId in typing_start');
            return;
        }

        console.log(`⌨️ [MessageHandler] ${user.username} started typing to ${receiverId} in conversation ${conversationId}`);

        // Send typing start to receiver
        io.to(`user:${receiverId}`).emit('typing_start', {
            conversationId,
            userId: user.userId,
            username: user.username,
        });

        // Also send to conversation room
        socket.to(`conversation:${conversationId}`).emit('typing_start', {
            conversationId,
            userId: user.userId,
            username: user.username,
        });
    });

    socket.on('typing_stop', (data) => {
        console.log('⌨️ [MessageHandler] Received typing_stop:', data);

        if (!requireAuth(socket)) return;

        const user = getUserFromSocket(socket);
        if (!user) return;

        const { conversationId, receiverId } = data;

        if (!conversationId || !receiverId) {
            console.error('❌ [MessageHandler] Missing conversationId or receiverId in typing_stop');
            return;
        }

        console.log(`⌨️ [MessageHandler] ${user.username} stopped typing to ${receiverId} in conversation ${conversationId}`);

        // Send typing stop to receiver
        io.to(`user:${receiverId}`).emit('typing_stop', {
            conversationId,
            userId: user.userId,
            username: user.username,
        });

        // Also send to conversation room
        socket.to(`conversation:${conversationId}`).emit('typing_stop', {
            conversationId,
            userId: user.userId,
            username: user.username,
        });
    });

    // Enhanced message reading handlers
    socket.on('mark_message_read', async (data) => {
        console.log('👁️ [MessageHandler] Received mark_message_read:', data);

        if (!requireAuth(socket)) return;

        const user = getUserFromSocket(socket);
        if (!user) return;

        try {
            const { messageId, conversationId } = data;

            if (!messageId || !conversationId) {
                console.error('❌ [MessageHandler] Missing messageId or conversationId');
                return;
            }

            // Update message as read
            const updatedMessage = await prisma.message.updateMany({
                where: {
                    id: messageId,
                    conversationId: conversationId,
                    receiverId: user.userId // Only allow marking own received messages as read
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });

            if (updatedMessage.count > 0) {
                console.log(`✅ [MessageHandler] Message ${messageId} marked as read by ${user.username}`);

                // Get the message to find the sender
                const message = await prisma.message.findUnique({
                    where: { id: messageId },
                    select: { senderId: true, sender: { select: { username: true } } }
                });

                if (message) {
                    console.log(`📡 [MessageHandler] Notifying sender ${message.sender.username} that message was read`);

                    // Notify the sender that their message was read
                    io.to(`user:${message.senderId}`).emit('message_read', {
                        messageId,
                        conversationId,
                        readBy: user.userId,
                        readByUsername: user.username,
                        readAt: new Date().toISOString()
                    });
                }
            }

        } catch (error) {
            console.error('❌ [MessageHandler] Mark message read error:', error);
        }
    });

    // Enhanced conversation reading handler
    socket.on('mark_conversation_read', async (data) => {
        console.log('👁️ [MessageHandler] Received mark_conversation_read:', data);

        if (!requireAuth(socket)) return;

        const user = getUserFromSocket(socket);
        if (!user) return;

        try {
            const { conversationId } = data;

            if (!conversationId) {
                console.error('❌ [MessageHandler] Missing conversationId');
                return;
            }

            // Mark all unread messages in the conversation as read
            const updatedMessages = await prisma.message.updateMany({
                where: {
                    conversationId: conversationId,
                    receiverId: user.userId,
                    isRead: false
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });

            console.log(`✅ [MessageHandler] Marked ${updatedMessages.count} messages as read in conversation ${conversationId} for ${user.username}`);

            if (updatedMessages.count > 0) {
                // Get the conversation to find other participants
                const conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId },
                    include: {
                        participants: {
                            select: { id: true, username: true }
                        }
                    }
                });

                if (conversation) {
                    // Notify other participants
                    conversation.participants.forEach(participant => {
                        if (participant.id !== user.userId) {
                            console.log(`📡 [MessageHandler] Notifying ${participant.username} that ${user.username} read the conversation`);

                            io.to(`user:${participant.id}`).emit('conversation_read', {
                                conversationId,
                                readBy: user.userId,
                                readByUsername: user.username,
                                readAt: new Date().toISOString(),
                                messagesRead: updatedMessages.count
                            });
                        }
                    });
                }
            }

        } catch (error) {
            console.error('❌ [MessageHandler] Mark conversation read error:', error);
        }
    });

    // Enhanced conversation room management
    socket.on('join_conversation', (data) => {
        console.log('🏠 [MessageHandler] User joining conversation:', data);
        const { conversationId } = data;

        if (conversationId) {
            socket.join(`conversation:${conversationId}`);
            console.log(`✅ [MessageHandler] Socket ${socket.id} joined conversation: ${conversationId}`);

            // Verify the join
            const rooms = Array.from(socket.rooms);
            console.log(`🔍 [MessageHandler] Socket rooms after join:`, rooms);
        }
    });

    socket.on('leave_conversation', (data) => {
        console.log('🚪 [MessageHandler] User leaving conversation:', data);
        const { conversationId } = data;

        if (conversationId) {
            socket.leave(`conversation:${conversationId}`);
            console.log(`✅ [MessageHandler] Socket ${socket.id} left conversation: ${conversationId}`);

            // Verify the leave
            const rooms = Array.from(socket.rooms);
            console.log(`🔍 [MessageHandler] Socket rooms after leave:`, rooms);
        }
    });

    // Enhanced disconnect handler
    socket.on('disconnect', (reason) => {
        const user = getUserFromSocket(socket);
        if (user) {
            console.log(`👋 [MessageHandler] User ${user.username} (${user.userId}) disconnected from socket ${socket.id}, reason: ${reason}`);

            // Enhanced connection manager cleanup
            connectionManager.handleDisconnection(socket, io).then(() => {
                console.log(`✅ [MessageHandler] Connection cleanup completed for ${user.username}`);

                // Verify the user's online status after cleanup
                const stillOnline = connectionManager.isUserOnline(user.userId);
                console.log(`🔍 [MessageHandler] User ${user.username} online status after disconnect: ${stillOnline}`);

                // Only broadcast offline if user has no more connections
                if (!stillOnline) {
                    console.log(`📡 [MessageHandler] Broadcasting offline status for ${user.username}`);
                    socket.broadcast.emit('user_offline', {
                        userId: user.userId,
                        username: user.username,
                        lastSeenAt: new Date().toISOString()
                    });
                }
            }).catch(error => {
                console.error('❌ [MessageHandler] Error in disconnect cleanup:', error);
            });
        } else {
            console.log(`👋 [MessageHandler] Unknown user disconnected from socket ${socket.id}, reason: ${reason}`);
        }
    });

    // Enhanced error handler
    socket.on('error', (error) => {
        const user = getUserFromSocket(socket);
        console.error('💥 [MessageHandler] Socket error:', {
            socketId: socket.id,
            userId: user?.userId,
            username: user?.username,
            error: error.message,
            stack: error.stack
        });
    });

    // New: Connection verification handler for debugging
    socket.on('verify_connection', (data, callback) => {
        const user = getUserFromSocket(socket);
        if (user) {
            const onlineStatus = connectionManager.isUserOnline(user.userId);
            const connections = connectionManager.getUserConnections(user.userId);

            const verification = {
                success: true,
                user: {
                    id: user.userId,
                    username: user.username
                },
                connection: {
                    socketId: socket.id,
                    online: onlineStatus,
                    connections: connections.size,
                    rooms: Array.from(socket.rooms)
                },
                timestamp: new Date().toISOString()
            };

            console.log('🔍 [MessageHandler] Connection verification:', verification);
            callback?.(verification);
        } else {
            callback?.({ success: false, error: 'No user authenticated' });
        }
    });
}