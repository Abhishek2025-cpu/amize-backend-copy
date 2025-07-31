import { getUserFromSocket } from './auth.js';

import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient()

class ConnectionManager {
    constructor() {
        this.activeUsers = new Map();
        this.socketToUser = new Map();
        this.userToSockets = new Map(); // New: Track multiple sockets per user
        this.connectionEvents = new Map(); // New: Track connection events for debugging

        // Enhanced logging
        console.log('🔗 [ConnectionManager] Initialized with enhanced tracking');
    }

    async handleConnection(socket, io) {
        const user = getUserFromSocket(socket);
        if (!user) {
            console.warn('⚠️ [ConnectionManager] No user data in socket during connection');
            return;
        }

        const { userId, username } = user;
        const socketId = socket.id;
        const timestamp = new Date();

        console.log(`🔗 [ConnectionManager] Processing connection: ${username} (${userId}) via socket ${socketId}`);

        try {
            // 1. IMMEDIATE socket-to-user mapping (critical for fast lookups)
            this.socketToUser.set(socketId, userId);
            console.log(`✅ [ConnectionManager] Socket mapping created: ${socketId} -> ${userId}`);

            // 2. Update user-to-sockets mapping
            if (!this.userToSockets.has(userId)) {
                this.userToSockets.set(userId, new Set());
            }
            this.userToSockets.get(userId).add(socketId);

            // 3. Update or create active user entry
            const existingUser = this.activeUsers.get(userId);
            if (existingUser) {
                // User reconnecting or has multiple connections
                existingUser.connections.add(socketId);
                existingUser.lastActivity = timestamp;
                existingUser.connectionCount = existingUser.connections.size;
                console.log(`🔄 [ConnectionManager] User ${username} reconnected (${existingUser.connectionCount} connections)`);
            } else {
                // New user connection
                const userData = {
                    userId,
                    username,
                    connections: new Set([socketId]),
                    lastActivity: timestamp,
                    connectedAt: timestamp,
                    connectionCount: 1,
                };

                this.activeUsers.set(userId, userData);
                console.log(`🆕 [ConnectionManager] New user online: ${username} (${userId})`);

                // Update database status asynchronously (don't block the connection)
                this.updateUserOnlineStatus(userId, true).catch(error => {
                    console.error('❌ [ConnectionManager] Error updating DB status:', error);
                });

                // Broadcast user online status asynchronously
                this.broadcastUserStatus(userId, username, true, io).catch(error => {
                    console.error('❌ [ConnectionManager] Error broadcasting status:', error);
                });
            }

            // 4. Store connection event for debugging
            this.connectionEvents.set(socketId, {
                userId,
                username,
                connectedAt: timestamp,
                event: 'connected'
            });

            // 5. VERIFICATION: Immediately verify the user is tracked as online
            const isOnlineCheck = this.isUserOnline(userId);
            console.log(`🔍 [ConnectionManager] Online status verification for ${username}: ${isOnlineCheck}`);

            if (!isOnlineCheck) {
                console.error(`❌ [ConnectionManager] CRITICAL: User ${userId} not showing as online after connection!`);
                this.logDebugState(userId);
            } else {
                console.log(`✅ [ConnectionManager] User ${username} successfully registered as online`);
            }

            // 6. Log current state
            this.logConnectionStats();

        } catch (error) {
            console.error('❌ [ConnectionManager] Error in handleConnection:', error);
            console.error('❌ [ConnectionManager] Stack trace:', error.stack);
        }
    }

    async handleDisconnection(socket, io) {
        const socketId = socket.id;
        const userId = this.socketToUser.get(socketId);

        if (!userId) {
            console.warn(`⚠️ [ConnectionManager] No user mapping found for disconnecting socket ${socketId}`);
            return;
        }

        console.log(`🔌 [ConnectionManager] Processing disconnection: socket ${socketId} for user ${userId}`);

        try {
            // 1. Remove socket mapping immediately
            this.socketToUser.delete(socketId);

            // 2. Update user-to-sockets mapping
            const userSockets = this.userToSockets.get(userId);
            if (userSockets) {
                userSockets.delete(socketId);
                if (userSockets.size === 0) {
                    this.userToSockets.delete(userId);
                }
            }

            // 3. Update active user entry
            const activeUser = this.activeUsers.get(userId);
            if (!activeUser) {
                console.warn(`⚠️ [ConnectionManager] No active user entry found for ${userId}`);
                return;
            }

            // Remove this connection
            activeUser.connections.delete(socketId);
            activeUser.connectionCount = activeUser.connections.size;

            // 4. If no more connections, mark user as offline
            if (activeUser.connections.size === 0) {
                console.log(`📴 [ConnectionManager] User ${activeUser.username} going offline (no more connections)`);

                // Remove from active users
                this.activeUsers.delete(userId);

                // Update database status asynchronously
                this.updateUserOnlineStatus(userId, false).catch(error => {
                    console.error('❌ [ConnectionManager] Error updating DB offline status:', error);
                });

                // Broadcast user offline status asynchronously
                this.broadcastUserStatus(userId, activeUser.username, false, io).catch(error => {
                    console.error('❌ [ConnectionManager] Error broadcasting offline status:', error);
                });
            } else {
                console.log(`🔄 [ConnectionManager] User ${activeUser.username} still has ${activeUser.connections.size} connections`);
            }

            // 5. Update connection event for debugging
            const connectionEvent = this.connectionEvents.get(socketId);
            if (connectionEvent) {
                connectionEvent.disconnectedAt = new Date();
                connectionEvent.event = 'disconnected';
            }

            // 6. Log current state
            this.logConnectionStats();

        } catch (error) {
            console.error('❌ [ConnectionManager] Error in handleDisconnection:', error);
        }
    }

    // Enhanced online check with multiple verification methods
    isUserOnline(userId) {
        // Method 1: Check activeUsers map (primary)
        const isInActiveUsers = this.activeUsers.has(userId);

        // Method 2: Check userToSockets map (backup)
        const hasActiveSockets = this.userToSockets.has(userId) && this.userToSockets.get(userId).size > 0;

        // Method 3: Check if any sockets exist for this user (fallback)
        let hasSocketMappings = false;
        for (const [socketId, mappedUserId] of this.socketToUser) {
            if (mappedUserId === userId) {
                hasSocketMappings = true;
                break;
            }
        }

        const result = isInActiveUsers || hasActiveSockets || hasSocketMappings;

        // Enhanced logging for debugging
        if (!result && (isInActiveUsers || hasActiveSockets || hasSocketMappings)) {
            console.log(`🔍 [ConnectionManager] Online check inconsistency for ${userId}:`, {
                activeUsers: isInActiveUsers,
                userToSockets: hasActiveSockets,
                socketMappings: hasSocketMappings,
                result
            });
        }

        return result;
    }

    // Enhanced method to get user connections with verification
    getUserConnections(userId) {
        // Primary method
        const activeUser = this.activeUsers.get(userId);
        if (activeUser) {
            return activeUser.connections;
        }

        // Fallback method
        const userSockets = this.userToSockets.get(userId);
        if (userSockets && userSockets.size > 0) {
            console.log(`🔍 [ConnectionManager] Using fallback connections for ${userId}`);
            return userSockets;
        }

        return new Set();
    }

    getOnlineUsers() {
        return Array.from(this.activeUsers.keys());
    }

    updateUserActivity(socket) {
        const userId = this.socketToUser.get(socket.id);
        if (!userId) return;

        const activeUser = this.activeUsers.get(userId);
        if (activeUser) {
            activeUser.lastActivity = new Date();
        }
    }

    async updateUserOnlineStatus(userId, isOnline) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    isOnline,
                    lastSeenAt: new Date(),
                },
            });
            console.log(`📊 [ConnectionManager] Database updated: ${userId} online=${isOnline}`);
        } catch (error) {
            console.error('❌ [ConnectionManager] Error updating user online status:', error);
        }
    }

    async broadcastUserStatus(userId, username, isOnline, io) {
        try {
            // Get users who should be notified (followers, recent conversations)
            const relevantUsers = await this.getRelevantUsersForStatus(userId);

            console.log(`📡 [ConnectionManager] Broadcasting ${isOnline ? 'online' : 'offline'} status for ${username} to ${relevantUsers.length} users`);

            // Broadcast to each relevant user's connections
            relevantUsers.forEach((targetUserId) => {
                const connections = this.getUserConnections(targetUserId);
                connections.forEach((socketId) => {
                    const userSocket = io.sockets.sockets.get(socketId);
                    if (userSocket) {
                        const statusData = isOnline
                            ? { userId, username, onlineAt: new Date() }
                            : { userId, username, lastSeenAt: new Date() };

                        const event = isOnline ? 'user_online' : 'user_offline';
                        userSocket.emit(event, statusData);
                    }
                });
            });
        } catch (error) {
            console.error('❌ [ConnectionManager] Error broadcasting user status:', error);
        }
    }

    async getRelevantUsersForStatus(userId) {
        try {
            // Get users from recent conversations
            const conversations = await prisma.conversation.findMany({
                where: {
                    participants: {
                        some: { id: userId },
                    },
                    lastMessageAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    },
                },
                include: {
                    participants: {
                        select: { id: true },
                    },
                },
            });

            const relevantUserIds = new Set();

            conversations.forEach((conv) => {
                conv.participants.forEach((participant) => {
                    if (participant.id !== userId) {
                        relevantUserIds.add(participant.id);
                    }
                });
            });

            return Array.from(relevantUserIds);
        } catch (error) {
            console.error('❌ [ConnectionManager] Error getting relevant users for status:', error);
            return [];
        }
    }

    // Enhanced debugging methods
    logDebugState(userId = null) {
        if (userId) {
            console.log(`🔍 [ConnectionManager] Debug state for user ${userId}:`, {
                inActiveUsers: this.activeUsers.has(userId),
                activeUserData: this.activeUsers.get(userId),
                userSockets: this.userToSockets.get(userId),
                socketMappings: Array.from(this.socketToUser.entries()).filter(([_, uid]) => uid === userId)
            });
        } else {
            console.log(`🔍 [ConnectionManager] Global debug state:`, {
                activeUsersCount: this.activeUsers.size,
                socketToUserCount: this.socketToUser.size,
                userToSocketsCount: this.userToSockets.size,
                activeUsers: Array.from(this.activeUsers.keys()),
                connectionEvents: this.connectionEvents.size
            });
        }
    }

    logConnectionStats() {
        console.log(`📊 [ConnectionManager] Stats:`, {
            activeUsers: this.activeUsers.size,
            totalSockets: this.socketToUser.size,
            userSocketMappings: this.userToSockets.size
        });
    }

    // New method: Force refresh user online status
    forceRefreshUserStatus(userId) {
        console.log(`🔄 [ConnectionManager] Force refreshing status for user ${userId}`);

        const hasActiveConnections = this.getUserConnections(userId).size > 0;
        const isCurrentlyTracked = this.activeUsers.has(userId);

        console.log(`🔍 [ConnectionManager] Refresh check: hasConnections=${hasActiveConnections}, isTracked=${isCurrentlyTracked}`);

        return hasActiveConnections;
    }

    // Cleanup method for graceful shutdown
    cleanup() {
        console.log('🧹 [ConnectionManager] Cleaning up connection data');
        this.activeUsers.clear();
        this.socketToUser.clear();
        this.userToSockets.clear();
        this.connectionEvents.clear();
    }
}

export const connectionManager = new ConnectionManager();