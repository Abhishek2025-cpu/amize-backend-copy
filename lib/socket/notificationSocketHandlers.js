import { getUserFromSocket, requireAuth } from './auth.js';

import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient()

/**
 * Setup notification-related socket event handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server instance
 */
export function setupNotificationHandlers(socket, io) {
    const user = getUserFromSocket(socket);

    // Join user to their notification room immediately when socket connects
    if (user) {
        socket.join(`notifications:${user.userId}`);
        console.log(`🔔 [NotificationHandler] User ${user.username} joined notification room: notifications:${user.userId}`);

        // Send initial notification count when user connects
        sendUnreadNotificationCount(socket, user.userId);
    }

    // Get notifications with pagination
    socket.on('get_notifications', async (data, callback) => {
        console.log('🔔 [NotificationHandler] Received get_notifications event:', data);

        if (!requireAuth(socket, (error) => {
            console.error('❌ [NotificationHandler] Auth failed:', error);
            callback?.({ success: false, error });
        })) {
            return;
        }

        const user = getUserFromSocket(socket);
        if (!user) {
            console.error('❌ [NotificationHandler] No user found in socket');
            callback?.({ success: false, error: 'Authentication required' });
            return;
        }

        try {
            const { page = 1, limit = 20 } = data || {};
            const offset = (page - 1) * limit;

            console.log('🔔 [NotificationHandler] Fetching notifications:', {
                userId: user.userId,
                page,
                limit,
                offset
            });

            // Get notifications with related data
            const notifications = await prisma.notification.findMany({
                where: {
                    userId: user.userId
                },
                include: {
                    causerUser: {
                        select: {
                            id: true,
                            username: true,
                            profilePhotoUrl: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit,
                skip: offset,
            });

            // Get unread count
            const unreadCount = await prisma.notification.count({
                where: {
                    userId: user.userId,
                    isRead: false
                }
            });

            // Get total count for pagination
            const totalCount = await prisma.notification.count({
                where: {
                    userId: user.userId
                }
            });

            const hasMore = (offset + notifications.length) < totalCount;

            console.log('✅ [NotificationHandler] Notifications fetched:', {
                count: notifications.length,
                unreadCount,
                totalCount,
                hasMore
            });

            callback?.({
                success: true,
                notifications: notifications.map(formatNotificationForClient),
                unreadCount,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    hasMore
                }
            });

        } catch (error) {
            console.error('❌ [NotificationHandler] Get notifications error:', error);
            callback?.({
                success: false,
                error: 'Failed to fetch notifications'
            });
        }
    });

    // Mark specific notification as read
    socket.on('mark_notification_read', async (data, callback) => {
        console.log('🔔 [NotificationHandler] Received mark_notification_read:', data);

        if (!requireAuth(socket, (error) => {
            callback?.({ success: false, error });
        })) return;

        const user = getUserFromSocket(socket);
        if (!user) {
            callback?.({ success: false, error: 'Authentication required' });
            return;
        }

        try {
            const { notificationId } = data;

            if (!notificationId) {
                console.error('❌ [NotificationHandler] Missing notificationId');
                callback?.({ success: false, error: 'Notification ID required' });
                return;
            }

            // Update notification as read (ensure user owns the notification)
            const updatedNotification = await prisma.notification.updateMany({
                where: {
                    id: notificationId,
                    userId: user.userId // Security: ensure user owns this notification
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });

            if (updatedNotification.count > 0) {
                console.log(`✅ [NotificationHandler] Notification ${notificationId} marked as read by user ${user.userId}`);

                // Get updated unread count
                const unreadCount = await prisma.notification.count({
                    where: {
                        userId: user.userId,
                        isRead: false
                    }
                });

                // Emit updated unread count to user
                socket.emit('notification_count_updated', { unreadCount });

                callback?.({
                    success: true,
                    message: 'Notification marked as read',
                    unreadCount
                });
            } else {
                console.error(`❌ [NotificationHandler] Notification ${notificationId} not found or not owned by user ${user.userId}`);
                callback?.({
                    success: false,
                    error: 'Notification not found'
                });
            }

        } catch (error) {
            console.error('❌ [NotificationHandler] Mark notification read error:', error);
            callback?.({
                success: false,
                error: 'Failed to mark notification as read'
            });
        }
    });

    // Mark all notifications as read
    socket.on('mark_all_notifications_read', async (data, callback) => {
        console.log('🔔 [NotificationHandler] Received mark_all_notifications_read');

        if (!requireAuth(socket, (error) => {
            callback?.({ success: false, error });
        })) return;

        const user = getUserFromSocket(socket);
        if (!user) {
            callback?.({ success: false, error: 'Authentication required' });
            return;
        }

        try {
            // Update all unread notifications for the user
            const result = await prisma.notification.updateMany({
                where: {
                    userId: user.userId,
                    isRead: false
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });

            console.log(`✅ [NotificationHandler] ${result.count} notifications marked as read for user ${user.userId}`);

            // Emit updated unread count (should be 0 now)
            socket.emit('notification_count_updated', { unreadCount: 0 });

            callback?.({
                success: true,
                message: `${result.count} notifications marked as read`,
                unreadCount: 0
            });

        } catch (error) {
            console.error('❌ [NotificationHandler] Mark all notifications read error:', error);
            callback?.({
                success: false,
                error: 'Failed to mark all notifications as read'
            });
        }
    });

    // Delete specific notification
    socket.on('delete_notification', async (data, callback) => {
        console.log('🔔 [NotificationHandler] Received delete_notification:', data);

        if (!requireAuth(socket, (error) => {
            callback?.({ success: false, error });
        })) return;

        const user = getUserFromSocket(socket);
        if (!user) {
            callback?.({ success: false, error: 'Authentication required' });
            return;
        }

        try {
            const { notificationId } = data;

            if (!notificationId) {
                callback?.({ success: false, error: 'Notification ID required' });
                return;
            }

            // Delete notification (ensure user owns it)
            const result = await prisma.notification.deleteMany({
                where: {
                    id: notificationId,
                    userId: user.userId // Security: ensure user owns this notification
                }
            });

            if (result.count > 0) {
                console.log(`✅ [NotificationHandler] Notification ${notificationId} deleted by user ${user.userId}`);

                // Get updated unread count
                const unreadCount = await prisma.notification.count({
                    where: {
                        userId: user.userId,
                        isRead: false
                    }
                });

                // Emit updated unread count to user
                socket.emit('notification_count_updated', { unreadCount });

                callback?.({
                    success: true,
                    message: 'Notification deleted',
                    unreadCount
                });
            } else {
                callback?.({ success: false, error: 'Notification not found' });
            }

        } catch (error) {
            console.error('❌ [NotificationHandler] Delete notification error:', error);
            callback?.({ success: false, error: 'Failed to delete notification' });
        }
    });

    // Get notification settings
    socket.on('get_notification_settings', async (data, callback) => {
        console.log('🔔 [NotificationHandler] Received get_notification_settings');

        if (!requireAuth(socket, (error) => {
            callback?.({ success: false, error });
        })) return;

        const user = getUserFromSocket(socket);
        if (!user) {
            callback?.({ success: false, error: 'Authentication required' });
            return;
        }

        try {
            // Get user settings including notification preferences
            const userSettings = await prisma.userSettings.findUnique({
                where: { userId: user.userId },
                select: {
                    notificationSettings: true
                }
            });

            let notificationSettings = {
                follows: true,
                messages: true,
                likes: true,
                comments: true,
                mentions: true,
                pushNotifications: true
            };

            // Parse existing settings if they exist
            if (userSettings?.notificationSettings) {
                try {
                    const parsed = JSON.parse(userSettings.notificationSettings);
                    notificationSettings = { ...notificationSettings, ...parsed };
                } catch (parseError) {
                    console.error('❌ [NotificationHandler] Error parsing notification settings:', parseError);
                }
            }

            callback?.({
                success: true,
                settings: notificationSettings
            });

        } catch (error) {
            console.error('❌ [NotificationHandler] Get notification settings error:', error);
            callback?.({ success: false, error: 'Failed to get notification settings' });
        }
    });

    // Update notification settings
    socket.on('update_notification_settings', async (data, callback) => {
        console.log('🔔 [NotificationHandler] Received update_notification_settings:', data);

        if (!requireAuth(socket, (error) => {
            callback?.({ success: false, error });
        })) return;

        const user = getUserFromSocket(socket);
        if (!user) {
            callback?.({ success: false, error: 'Authentication required' });
            return;
        }

        try {
            const { settings } = data;

            if (!settings || typeof settings !== 'object') {
                callback?.({ success: false, error: 'Invalid settings data' });
                return;
            }

            // Update user settings with new notification preferences
            await prisma.userSettings.upsert({
                where: { userId: user.userId },
                update: {
                    notificationSettings: JSON.stringify(settings)
                },
                create: {
                    userId: user.userId,
                    notificationSettings: JSON.stringify(settings)
                }
            });

            console.log(`✅ [NotificationHandler] Notification settings updated for user ${user.userId}`);

            callback?.({
                success: true,
                message: 'Notification settings updated',
                settings
            });

        } catch (error) {
            console.error('❌ [NotificationHandler] Update notification settings error:', error);
            callback?.({ success: false, error: 'Failed to update notification settings' });
        }
    });
}

/**
 * Send unread notification count to user
 * @param {Socket} socket - User's socket
 * @param {string} userId - User ID
 */
async function sendUnreadNotificationCount(socket, userId) {
    try {
        const unreadCount = await prisma.notification.count({
            where: {
                userId: userId,
                isRead: false
            }
        });

        socket.emit('notification_count_updated', { unreadCount });
        console.log(`🔔 [NotificationHandler] Sent unread count (${unreadCount}) to user ${userId}`);
    } catch (error) {
        console.error('❌ [NotificationHandler] Error sending unread count:', error);
    }
}

/**
 * Format notification for client consumption
 * @param {Object} notification - Raw notification from database
 * @returns {Object} Formatted notification
 */
function formatNotificationForClient(notification) {
    return {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        videoId: notification.videoId,
        causerUser: notification.causerUser ? {
            id: notification.causerUser.id,
            username: notification.causerUser.username,
            profilePhotoUrl: notification.causerUser.profilePhotoUrl
        } : null
    };
}