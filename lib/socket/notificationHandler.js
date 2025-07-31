import { connectionManager } from './connectionManager.js';
import { globalSocketManager } from './globalSocketManager.js';

import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient()

class EnhancedNotificationManager {
    constructor() {
        this.notificationTypes = {
            FOLLOW: 'follow',
            MESSAGE: 'message',
            LIKE: 'like',
            COMMENT: 'comment',
            MENTION: 'mention',
            SYSTEM: 'system'
        };

        // Enhanced queue system
        this.notificationQueue = new Map();
        this.retryInterval = null;
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds

        // New: Priority notifications that bypass online checks
        this.priorityTypes = new Set([
            this.notificationTypes.FOLLOW,
            this.notificationTypes.MESSAGE
        ]);

        // Enhanced logging and debugging
        this.deliveryStats = {
            sent: 0,
            failed: 0,
            queued: 0,
            retried: 0
        };

        this.startRetryProcessor();
        console.log('🔔 [NotificationManager] Enhanced notification manager initialized');
    }

    async sendNotification(userId, type, message, causerUserId = null, videoId = null, additionalData = {}) {
        try {
            console.log(`🔔 [NotificationManager] Sending ${type} notification to user ${userId}`);

            // Check if user has this type of notification enabled
            const shouldSend = await this.checkNotificationSettings(userId, type);
            if (!shouldSend) {
                console.log(`⏭️ [NotificationManager] User ${userId} has disabled ${type} notifications`);
                return null;
            }

            // Create notification in database
            const notification = await prisma.notification.create({
                data: {
                    type,
                    message,
                    userId,
                    causerUserId,
                    videoId,
                    ...additionalData
                },
                include: {
                    causerUser: {
                        select: {
                            id: true,
                            username: true,
                            profilePhotoUrl: true,
                        }
                    }
                }
            });

            console.log(`✅ [NotificationManager] Notification created with ID: ${notification.id}`);

            // Enhanced real-time delivery with multiple strategies
            const realTimeSent = await this.enhancedRealTimeDelivery(userId, notification, type);

            if (realTimeSent) {
                console.log(`📡 [NotificationManager] Real-time notification sent successfully`);
                this.deliveryStats.sent++;
            } else {
                console.log(`📤 [NotificationManager] Real-time notification failed, queued for retry`);
                this.queueForRetry(userId, notification);
                this.deliveryStats.queued++;
            }

            // Update unread count
            await this.updateUnreadCount(userId);

            return notification;
        } catch (error) {
            console.error('💥 [NotificationManager] Error sending notification:', error);
            this.deliveryStats.failed++;
            return null;
        }
    }

    async enhancedRealTimeDelivery(userId, notification, type) {
        try {
            console.log(`📡 [NotificationManager] Enhanced delivery for ${type} notification to user ${userId}`);

            // Strategy 1: Check if it's a priority notification that bypasses online checks
            const isPriority = this.priorityTypes.has(type);

            // Strategy 2: Multiple online detection methods
            const onlineStatus = this.comprehensiveOnlineCheck(userId);

            console.log(`🔍 [NotificationManager] Delivery analysis:`, {
                userId,
                type,
                isPriority,
                onlineStatus: {
                    connectionManager: onlineStatus.connectionManager,
                    socketManager: onlineStatus.socketManager,
                    fallback: onlineStatus.fallback,
                    final: onlineStatus.isOnline
                }
            });

            // Strategy 3: For priority notifications, attempt delivery regardless of online status
            if (isPriority) {
                console.log(`⭐ [NotificationManager] Priority notification - attempting delivery regardless of online status`);
                return await this.attemptDeliveryWithFallbacks(userId, notification);
            }

            // Strategy 4: For non-priority, check online status but with fallbacks
            if (!onlineStatus.isOnline) {
                // Last attempt: Force refresh connection manager state
                console.log(`🔄 [NotificationManager] User appears offline, attempting connection refresh`);
                const refreshedStatus = connectionManager.forceRefreshUserStatus(userId);

                if (!refreshedStatus) {
                    console.log(`📤 [NotificationManager] User ${userId} confirmed offline after refresh, notification stored for later`);
                    return false;
                }

                console.log(`✅ [NotificationManager] User ${userId} found online after refresh, proceeding with delivery`);
            }

            // Attempt delivery with all available methods
            return await this.attemptDeliveryWithFallbacks(userId, notification);

        } catch (error) {
            console.error('💥 [NotificationManager] Error in enhanced real-time delivery:', error);
            return false;
        }
    }

    comprehensiveOnlineCheck(userId) {
        // Method 1: ConnectionManager check
        const connectionManagerOnline = connectionManager.isUserOnline(userId);

        // Method 2: GlobalSocketManager check
        let socketManagerOnline = false;
        try {
            if (globalSocketManager.isInitialized()) {
                const io = globalSocketManager.getIO();
                if (io) {
                    // Check if user room exists and has members
                    const userRoom = `user:${userId}`;
                    const roomExists = globalSocketManager.roomExists(userRoom);
                    const socketsInRoom = globalSocketManager.getSocketsInRoom(userRoom);
                    socketManagerOnline = roomExists && socketsInRoom.size > 0;
                }
            }
        } catch (error) {
            console.error('❌ [NotificationManager] Error checking socket manager online status:', error);
        }

        // Method 3: Fallback check - direct socket inspection
        let fallbackOnline = false;
        try {
            const connections = connectionManager.getUserConnections(userId);
            fallbackOnline = connections && connections.size > 0;
        } catch (error) {
            console.error('❌ [NotificationManager] Error in fallback online check:', error);
        }

        // Final determination: online if ANY method reports online
        const isOnline = connectionManagerOnline || socketManagerOnline || fallbackOnline;

        return {
            connectionManager: connectionManagerOnline,
            socketManager: socketManagerOnline,
            fallback: fallbackOnline,
            isOnline
        };
    }

    async attemptDeliveryWithFallbacks(userId, notification) {
        const notificationData = {
            id: notification.id,
            type: notification.type,
            message: notification.message,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
            videoId: notification.videoId,
            causerUser: notification.causerUser
        };

        console.log(`📡 [NotificationManager] Attempting delivery with fallbacks for user ${userId}`);

        // Attempt 1: Use GlobalSocketManager's enhanced emitToUser
        try {
            if (globalSocketManager.isInitialized()) {
                console.log(`📡 [NotificationManager] Attempt 1: Using GlobalSocketManager enhanced emit`);
                const success = await globalSocketManager.emitToUser(userId, 'notification_received', {
                    notification: notificationData
                });

                if (success) {
                    console.log(`✅ [NotificationManager] Delivery successful via GlobalSocketManager`);
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ [NotificationManager] GlobalSocketManager delivery failed:', error);
        }

        // Attempt 2: Direct room emission to user room
        try {
            console.log(`📡 [NotificationManager] Attempt 2: Direct room emission`);
            const io = globalSocketManager.getIO();
            if (io) {
                io.to(`user:${userId}`).emit('notification_received', {
                    notification: notificationData
                });

                // Also try notification room
                io.to(`notifications:${userId}`).emit('notification_received', {
                    notification: notificationData
                });

                console.log(`✅ [NotificationManager] Delivery attempted via direct room emission`);
                return true; // Assume success since we can't easily verify
            }
        } catch (error) {
            console.error('❌ [NotificationManager] Direct room emission failed:', error);
        }

        // Attempt 3: Individual socket emission
        try {
            console.log(`📡 [NotificationManager] Attempt 3: Individual socket emission`);
            const connections = connectionManager.getUserConnections(userId);
            const io = globalSocketManager.getIO();

            if (io && connections && connections.size > 0) {
                let sentToAnySocket = false;

                for (const socketId of connections) {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.emit('notification_received', {
                            notification: notificationData
                        });
                        sentToAnySocket = true;
                        console.log(`✅ [NotificationManager] Sent to socket ${socketId}`);
                    }
                }

                if (sentToAnySocket) {
                    console.log(`✅ [NotificationManager] Delivery successful via individual socket emission`);
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ [NotificationManager] Individual socket emission failed:', error);
        }

        console.log(`❌ [NotificationManager] All delivery attempts failed for user ${userId}`);
        return false;
    }

    queueForRetry(userId, notification) {
        const queueKey = `${userId}-${notification.id}`;
        const queueItem = {
            userId,
            notification,
            attempts: 0,
            lastAttempt: Date.now(),
            maxRetries: this.maxRetries,
            queuedAt: new Date().toISOString()
        };

        this.notificationQueue.set(queueKey, queueItem);
        console.log(`📋 [NotificationManager] Queued notification ${notification.id} for retry (queue size: ${this.notificationQueue.size})`);
    }

    startRetryProcessor() {
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
        }

        this.retryInterval = setInterval(async () => {
            if (this.notificationQueue.size === 0) return;

            console.log(`🔄 [NotificationManager] Processing ${this.notificationQueue.size} queued notifications`);

            const now = Date.now();
            const itemsToRetry = [];
            const itemsToRemove = [];

            for (const [key, item] of this.notificationQueue) {
                // Check if enough time has passed since last attempt
                if (now - item.lastAttempt >= this.retryDelay) {
                    if (item.attempts < item.maxRetries) {
                        itemsToRetry.push([key, item]);
                    } else {
                        console.log(`❌ [NotificationManager] Max retries reached for notification ${item.notification.id}`);
                        itemsToRemove.push(key);
                    }
                }
            }

            // Remove items that exceeded max retries
            itemsToRemove.forEach(key => {
                this.notificationQueue.delete(key);
                this.deliveryStats.failed++;
            });

            // Retry items
            for (const [key, item] of itemsToRetry) {
                item.attempts++;
                item.lastAttempt = now;
                this.deliveryStats.retried++;

                console.log(`🔄 [NotificationManager] Retry ${item.attempts}/${item.maxRetries} for notification ${item.notification.id}`);

                const success = await this.enhancedRealTimeDelivery(
                    item.userId,
                    item.notification,
                    item.notification.type
                );

                if (success) {
                    console.log(`✅ [NotificationManager] Retry successful for notification ${item.notification.id}`);
                    this.notificationQueue.delete(key);
                    this.deliveryStats.sent++;
                } else {
                    console.log(`❌ [NotificationManager] Retry ${item.attempts}/${item.maxRetries} failed for notification ${item.notification.id}`);
                }
            }

            // Log stats periodically
            if (this.notificationQueue.size > 0 || itemsToRetry.length > 0) {
                console.log(`📊 [NotificationManager] Retry stats:`, this.deliveryStats);
            }
        }, this.retryDelay);

        console.log(`🔄 [NotificationManager] Retry processor started (interval: ${this.retryDelay}ms)`);
    }

    stopRetryProcessor() {
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
            console.log(`⏹️ [NotificationManager] Retry processor stopped`);
        }
    }

    async updateUnreadCount(userId) {
        try {
            const unreadCount = await prisma.notification.count({
                where: {
                    userId: userId,
                    isRead: false
                }
            });

            // Enhanced delivery for unread count updates
            const onlineStatus = this.comprehensiveOnlineCheck(userId);

            if (onlineStatus.isOnline && globalSocketManager.isInitialized()) {
                const success = await globalSocketManager.emitToUser(userId, 'notification_count_updated', { unreadCount });
                if (success) {
                    console.log(`📊 [NotificationManager] Updated unread count for user ${userId}: ${unreadCount}`);
                } else {
                    console.log(`⚠️ [NotificationManager] Failed to send unread count update to user ${userId}`);
                }
            }

            return unreadCount;
        } catch (error) {
            console.error('💥 [NotificationManager] Error updating unread count:', error);
            return 0;
        }
    }

    async checkNotificationSettings(userId, notificationType) {
        try {
            const userSettings = await prisma.userSettings.findUnique({
                where: { userId },
                select: { notificationSettings: true }
            });

            if (!userSettings?.notificationSettings) {
                return true; // Default to allowing all notifications
            }

            const settings = JSON.parse(userSettings.notificationSettings);

            const settingsMap = {
                [this.notificationTypes.FOLLOW]: settings.follows,
                [this.notificationTypes.MESSAGE]: settings.messages,
                [this.notificationTypes.LIKE]: settings.likes,
                [this.notificationTypes.COMMENT]: settings.comments,
                [this.notificationTypes.MENTION]: settings.mentions,
                [this.notificationTypes.SYSTEM]: true
            };

            return settingsMap[notificationType] !== false;
        } catch (error) {
            console.error('💥 [NotificationManager] Error checking notification settings:', error);
            return true;
        }
    }

    // Convenience methods for specific notification types
    async sendFollowNotification(followerId, followingId) {
        try {
            if (followerId === followingId) return null;

            const follower = await prisma.user.findUnique({
                where: { id: followerId },
                select: { username: true, profilePhotoUrl: true }
            });

            if (!follower) {
                console.error(`💥 [NotificationManager] Follower ${followerId} not found`);
                return null;
            }

            const message = `${follower.username} started following you`;

            console.log(`🔔 [NotificationManager] Sending follow notification: ${followerId} -> ${followingId}`);

            return await this.sendNotification(
                followingId,
                this.notificationTypes.FOLLOW,
                message,
                followerId
            );
        } catch (error) {
            console.error('💥 [NotificationManager] Error sending follow notification:', error);
            return null;
        }
    }

    async sendMessageNotification(receiverId, senderId, messageContent) {
        try {
            if (receiverId === senderId) return null;

            const sender = await prisma.user.findUnique({
                where: { id: senderId },
                select: { username: true, profilePhotoUrl: true }
            });

            if (!sender) {
                console.error(`💥 [NotificationManager] Sender ${senderId} not found`);
                return null;
            }

            const truncatedMessage = messageContent.length > 50
                ? messageContent.substring(0, 50) + '...'
                : messageContent;

            const message = `${sender.username}: ${truncatedMessage}`;

            console.log(`🔔 [NotificationManager] Sending message notification: ${senderId} -> ${receiverId}`);

            return await this.sendNotification(
                receiverId,
                this.notificationTypes.MESSAGE,
                message,
                senderId
            );
        } catch (error) {
            console.error('💥 [NotificationManager] Error sending message notification:', error);
            return null;
        }
    }

    // Enhanced diagnostic methods
    getQueueStats() {
        return {
            queueSize: this.notificationQueue.size,
            deliveryStats: this.deliveryStats,
            items: Array.from(this.notificationQueue.values()).map(item => ({
                notificationId: item.notification.id,
                userId: item.userId,
                type: item.notification.type,
                attempts: item.attempts,
                lastAttempt: new Date(item.lastAttempt).toISOString(),
                queuedAt: item.queuedAt
            }))
        };
    }

    logDiagnostics(userId = null) {
        console.log(`🔍 [NotificationManager] Diagnostics:`, {
            queueStats: this.getQueueStats(),
            deliveryStats: this.deliveryStats,
            globalSocketManagerInitialized: globalSocketManager.isInitialized(),
            connectionManagerStats: userId ? {
                userOnline: connectionManager.isUserOnline(userId),
                userConnections: connectionManager.getUserConnections(userId).size
            } : null
        });
    }

    clearQueue() {
        const size = this.notificationQueue.size;
        this.notificationQueue.clear();
        console.log(`🧹 [NotificationManager] Cleared notification queue (${size} items)`);
    }

    resetStats() {
        this.deliveryStats = {
            sent: 0,
            failed: 0,
            queued: 0,
            retried: 0
        };
        console.log(`📊 [NotificationManager] Stats reset`);
    }

    // Cleanup method
    cleanup() {
        this.stopRetryProcessor();
        this.clearQueue();
        this.resetStats();
        console.log(`🧹 [NotificationManager] Cleanup completed`);
    }
}

export const notificationManager = new EnhancedNotificationManager();
export default notificationManager;