import { Server } from "socket.io";

/**
 * Enhanced Global Socket.IO Manager with robust singleton pattern and improved reliability
 * Uses multiple layers of singleton enforcement to prevent instance duplication
 */

// Use Symbol for truly private global key
const GLOBAL_SOCKET_KEY = Symbol.for('app.globalSocketManager.v2');
const INITIALIZATION_LOCK_KEY = Symbol.for('app.globalSocketManager.initLock');

class GlobalSocketManager {
    constructor() {
        // Prevent direct instantiation if singleton already exists
        if (global[GLOBAL_SOCKET_KEY]) {
            // console.log('♻️ [GlobalSocketManager] Returning existing singleton instance');
            return global[GLOBAL_SOCKET_KEY];
        }

        this.io = null;
        this.initialized = false;
        this.initializationPromise = null;
        this.instanceId = Date.now() + Math.random(); // Unique instance identifier
        this.createdAt = new Date();

        // Enhanced state tracking
        this.stats = {
            emitAttempts: 0,
            emitSuccesses: 0,
            emitFailures: 0,
            recoveryAttempts: 0,
            lastActivity: null
        };

        // console.log(`🔧 [GlobalSocketManager] New instance created with ID: ${this.instanceId}`);

        // Store in global immediately to prevent duplication
        global[GLOBAL_SOCKET_KEY] = this;
    }

    /**
     * Enhanced initialization with atomic locking to prevent race conditions
     * @param {Server} socketIOServer - The Socket.IO server instance
     * @returns {Promise<boolean>} - Returns true if successfully initialized
     */
    async initialize(socketIOServer) {
        // Atomic initialization lock to prevent race conditions
        if (global[INITIALIZATION_LOCK_KEY]) {
            // console.log('⏳ [GlobalSocketManager] Initialization locked by another process, waiting...');
            let attempts = 0;
            while (global[INITIALIZATION_LOCK_KEY] && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
        }

        // Set lock
        global[INITIALIZATION_LOCK_KEY] = true;

        try {
            // Check if already initialized
            if (this.initialized && this.io) {
                console.warn('⚠️ [GlobalSocketManager] Already initialized, skipping...');
                return true;
            }

            // Prevent multiple simultaneous initializations
            if (this.initializationPromise) {
                // console.log('⏳ [GlobalSocketManager] Initialization in progress, waiting...');
                return await this.initializationPromise;
            }

            // Create initialization promise
            this.initializationPromise = this._performInitialization(socketIOServer);
            const result = await this.initializationPromise;

            this.initializationPromise = null;
            return result;

        } finally {
            // Release lock
            delete global[INITIALIZATION_LOCK_KEY];
        }
    }

    async _performInitialization(socketIOServer) {
        if (!socketIOServer) {
            // console.error('❌ [GlobalSocketManager] No socket server provided');
            return false;
        }

        try {
            this.io = socketIOServer;
            this.initialized = true;
            this.stats.lastActivity = new Date();

            // Verify the initialization
            if (!this.io || typeof this.io.emit !== 'function') {
                throw new Error('Invalid Socket.IO server instance');
            }

            // Double-check singleton enforcement
            const globalInstance = global[GLOBAL_SOCKET_KEY];
            if (globalInstance && globalInstance !== this) {
                console.warn('⚠️ [GlobalSocketManager] Multiple instances detected, consolidating...');
                // Copy state to global instance if it's more recent
                if (globalInstance.instanceId < this.instanceId) {
                    globalInstance.io = this.io;
                    globalInstance.initialized = this.initialized;
                    globalInstance.stats = { ...this.stats };
                    return globalInstance.initialized;
                }
            }

            // console.log('✅ [GlobalSocketManager] Socket.IO server instance registered globally');
            console.log('📊 [GlobalSocketManager] Initialization status:', {
                instanceId: this.instanceId,
                hasIO: !!this.io,
                initialized: this.initialized,
                socketConnections: this.io?.engine?.clientsCount || 0,
                globalInstanceId: global[GLOBAL_SOCKET_KEY]?.instanceId
            });

            return true;
        } catch (error) {
            // console.error('❌ [GlobalSocketManager] Initialization failed:', error);
            this.cleanup();
            return false;
        }
    }

    /**
     * Enhanced getIO with automatic recovery and validation
     * @returns {Server|null} The Socket.IO server instance or null if not available
     */
    getIO() {
        // Quick path for healthy state
        if (this.initialized && this.io && this._validateIOInstance()) {
            return this.io;
        }

        // Attempt recovery
        // console.log('🔄 [GlobalSocketManager] IO instance unhealthy, attempting recovery...');
        const recovered = this._attemptRecovery();

        if (recovered && this._validateIOInstance()) {
            // console.log('✅ [GlobalSocketManager] Recovery successful');
            return this.io;
        }

        // console.error('❌ [GlobalSocketManager] Socket.IO server not available after recovery');
        this._logDebugInfo();
        return null;
    }

    /**
     * Validate that the IO instance is functional
     * @private
     */
    _validateIOInstance() {
        try {
            return this.io &&
                typeof this.io.emit === 'function' &&
                typeof this.io.to === 'function' &&
                this.io.sockets &&
                this.io.sockets.adapter;
        } catch (error) {
            // console.error('❌ [GlobalSocketManager] IO instance validation failed:', error);
            return false;
        }
    }

    /**
     * Enhanced recovery with multiple strategies
     * @private
     */
    _attemptRecovery() {
        // console.log('🔄 [GlobalSocketManager] Attempting recovery...');
        this.stats.recoveryAttempts++;

        // Strategy 1: Recover from global instance
        const globalInstance = global[GLOBAL_SOCKET_KEY];
        if (globalInstance && globalInstance !== this && globalInstance.initialized && globalInstance.io) {
            // console.log('✅ [GlobalSocketManager] Recovered from global instance');
            this.io = globalInstance.io;
            this.initialized = globalInstance.initialized;
            this.stats = { ...globalInstance.stats };
            return true;
        }

        // Strategy 2: Check if current instance just needs revalidation
        if (this.io && this._validateIOInstance()) {
            // console.log('✅ [GlobalSocketManager] Instance validation passed on retry');
            this.initialized = true;
            return true;
        }

        // console.log('❌ [GlobalSocketManager] Recovery failed - no valid instance found');
        return false;
    }

    /**
     * Enhanced isInitialized check with automatic recovery
     * @returns {boolean} True if initialized and functional
     */
    isInitialized() {
        // Quick check
        if (this.initialized && this.io && this._validateIOInstance()) {
            return true;
        }

        // Attempt recovery before returning false
        const recovered = this._attemptRecovery();
        const result = recovered && this.initialized && this.io && this._validateIOInstance();

        if (!result) {
            console.log('🔍 [GlobalSocketManager] Not properly initialized:', {
                initialized: this.initialized,
                hasIO: !!this.io,
                validIO: this._validateIOInstance(),
                instanceId: this.instanceId,
                globalInstance: !!global[GLOBAL_SOCKET_KEY]
            });
        }

        return result;
    }

    /**
     * Ultra-enhanced emit to user with multiple strategies and better error handling
     * @param {string} userId - The user ID
     * @param {string} event - The event name
     * @param {object} data - The data to send
     * @returns {Promise<boolean>} True if emitted successfully, false otherwise
     */
    async emitToUser(userId, event, data) {
        this.stats.emitAttempts++;
        this.stats.lastActivity = new Date();

        const maxRetries = 3;
        const retryDelay = 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📡 [GlobalSocketManager] Emit attempt ${attempt}/${maxRetries} - '${event}' to user:${userId}`, {
                    event,
                    userId,
                    dataKeys: Object.keys(data || {}),
                    attempt,
                    instanceId: this.instanceId
                });

                const io = this.getIO();
                if (!io) {
                    if (attempt < maxRetries) {
                        // console.log(`🔄 [GlobalSocketManager] IO not available, waiting for retry ${attempt}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    }
                    // console.error('❌ [GlobalSocketManager] Cannot emit - Socket.IO not available after retries');
                    this.stats.emitFailures++;
                    return false;
                }

                // Strategy 1: Emit to user room with verification
                const userRoom = `user:${userId}`;
                const roomExists = this.roomExists(userRoom);
                const socketsInRoom = this.getSocketsInRoom(userRoom);

                console.log(`🔍 [GlobalSocketManager] Room analysis:`, {
                    userRoom,
                    roomExists,
                    socketsCount: socketsInRoom.size,
                    sockets: Array.from(socketsInRoom)
                });

                let emissionResults = [];

                // Emit to user room
                try {
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('Emit timeout')), 5000);

                        try {
                            io.to(userRoom).emit(event, data);
                            clearTimeout(timeout);
                            resolve(true);
                        } catch (err) {
                            clearTimeout(timeout);
                            reject(err);
                        }
                    });
                    emissionResults.push('user_room_success');
                } catch (err) {
                    // console.error('❌ [GlobalSocketManager] User room emission failed:', err);
                    emissionResults.push('user_room_failed');
                }

                // Strategy 2: Also emit to notification room for notification events
                if (event.includes('notification')) {
                    const notificationRoom = `notifications:${userId}`;
                    try {
                        await new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => reject(new Error('Notification emit timeout')), 5000);

                            try {
                                io.to(notificationRoom).emit(event, data);
                                clearTimeout(timeout);
                                resolve(true);
                            } catch (err) {
                                clearTimeout(timeout);
                                reject(err);
                            }
                        });
                        emissionResults.push('notification_room_success');
                    } catch (err) {
                        // console.error('❌ [GlobalSocketManager] Notification room emission failed:', err);
                        emissionResults.push('notification_room_failed');
                    }
                }

                // Strategy 3: Direct socket emission if rooms failed
                if (!emissionResults.some(result => result.includes('success'))) {
                    // console.log('🔄 [GlobalSocketManager] Room emissions failed, trying direct socket emission');

                    let directEmitSuccess = false;
                    for (const socketId of socketsInRoom) {
                        try {
                            const socket = io.sockets.sockets.get(socketId);
                            if (socket && typeof socket.emit === 'function') {
                                socket.emit(event, data);
                                directEmitSuccess = true;
                                // console.log(`✅ [GlobalSocketManager] Direct emit to socket ${socketId} successful`);
                            }
                        } catch (err) {
                            // console.error(`❌ [GlobalSocketManager] Direct emit to socket ${socketId} failed:`, err);
                        }
                    }

                    if (directEmitSuccess) {
                        emissionResults.push('direct_socket_success');
                    }
                }

                // Determine overall success
                const success = emissionResults.some(result => result.includes('success'));

                if (success) {
                    console.log(`✅ [GlobalSocketManager] Successfully emitted '${event}' to user:${userId}`, {
                        results: emissionResults,
                        attempt,
                        instanceId: this.instanceId
                    });
                    this.stats.emitSuccesses++;
                    return true;
                }

                // If this wasn't the last attempt, wait and retry
                if (attempt < maxRetries) {
                    // console.log(`🔄 [GlobalSocketManager] Emission failed, retrying in ${retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }

            } catch (error) {
                // console.error(`❌ [GlobalSocketManager] Emit attempt ${attempt} failed:`, error);

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        // console.error(`❌ [GlobalSocketManager] Failed to emit '${event}' to user:${userId} after ${maxRetries} attempts`);
        this.stats.emitFailures++;
        return false;
    }

    /**
     * Enhanced room existence check with error handling
     * @param {string} roomName - The room name to check
     * @returns {boolean} True if room exists, false otherwise
     */
    roomExists(roomName) {
        try {
            const io = this.getIO();
            if (!io) return false;
            return io.sockets.adapter.rooms.has(roomName);
        } catch (error) {
            // console.error('❌ [GlobalSocketManager] Error checking room existence:', error);
            return false;
        }
    }

    /**
     * Enhanced get sockets in room with error handling
     * @param {string} roomName - The room name
     * @returns {Set} Set of socket IDs in the room
     */
    getSocketsInRoom(roomName) {
        try {
            const io = this.getIO();
            if (!io) return new Set();
            return io.sockets.adapter.rooms.get(roomName) || new Set();
        } catch (error) {
            // console.error('❌ [GlobalSocketManager] Error getting sockets in room:', error);
            return new Set();
        }
    }

    /**
     * Enhanced connection statistics with health check
     * @returns {object} Comprehensive connection statistics
     */
    getStats() {
        const io = this.getIO();

        let healthStatus = 'unhealthy';
        if (io && this._validateIOInstance()) {
            healthStatus = 'healthy';
        } else if (io) {
            healthStatus = 'degraded';
        }

        return {
            // Connection info
            connected: io?.engine?.clientsCount || 0,
            rooms: io?.sockets?.adapter?.rooms?.size || 0,

            // Initialization info
            initialized: this.initialized,
            instanceId: this.instanceId,
            createdAt: this.createdAt,

            // Health info
            healthStatus,
            validIO: this._validateIOInstance(),

            // Performance stats
            stats: { ...this.stats },

            // Recovery info
            recovered: !!global[GLOBAL_SOCKET_KEY],
            uptime: process.uptime()
        };
    }

    /**
     * Emit an event to a specific conversation room with enhanced error handling
     */
    emitToConversation(conversationId, event, data) {
        try {
            const io = this.getIO();
            if (!io) {
                // console.error('❌ [GlobalSocketManager] Cannot emit to conversation, Socket.IO not available');
                return false;
            }

            io.to(`conversation:${conversationId}`).emit(event, data);
            // console.log(`📡 [GlobalSocketManager] Emitted '${event}' to conversation:${conversationId}`);
            return true;
        } catch (error) {
            // console.error('❌ [GlobalSocketManager] Error emitting to conversation:', error);
            return false;
        }
    }

    /**
     * Broadcast an event to all connected clients with enhanced error handling
     */
    broadcast(event, data) {
        try {
            const io = this.getIO();
            if (!io) {
                // console.error('❌ [GlobalSocketManager] Cannot broadcast, Socket.IO not available');
                return false;
            }

            io.emit(event, data);
            // console.log(`📡 [GlobalSocketManager] Broadcasted '${event}' to all clients`);
            return true;
        } catch (error) {
            // console.error('❌ [GlobalSocketManager] Error broadcasting:', error);
            return false;
        }
    }

    /**
     * Enhanced cleanup with singleton preservation
     */
    cleanup() {
        // console.log('🧹 [GlobalSocketManager] Cleaning up Socket.IO instance');

        // Don't clear the global reference unless this is the global instance
        const globalInstance = global[GLOBAL_SOCKET_KEY];
        if (globalInstance === this) {
            delete global[GLOBAL_SOCKET_KEY];
            // console.log('🧹 [GlobalSocketManager] Cleared global singleton reference');
        }

        this.io = null;
        this.initialized = false;
        this.initializationPromise = null;
    }

    /**
     * Enhanced debug information
     * @private
     */
    _logDebugInfo() {
        const globalInstance = global[GLOBAL_SOCKET_KEY];
        console.log('🔍 [GlobalSocketManager] DEBUG INFO:', {
            // This instance
            thisInstance: {
                instanceId: this.instanceId,
                initialized: this.initialized,
                hasIO: !!this.io,
                validIO: this._validateIOInstance()
            },

            // Global instance
            globalInstance: globalInstance ? {
                instanceId: globalInstance.instanceId,
                initialized: globalInstance.initialized,
                hasIO: !!globalInstance.io,
                validIO: globalInstance._validateIOInstance ? globalInstance._validateIOInstance() : 'unknown',
                sameAsThis: globalInstance === this
            } : null,

            // Performance
            stats: this.stats
        });
    }

    /**
     * Force sync with global instance (for debugging)
     */
    forceSync() {
        // console.log('🔄 [GlobalSocketManager] Force syncing with global instance...');
        return this._attemptRecovery();
    }

    /**
     * Health check method
     */
    healthCheck() {
        const healthy = this.isInitialized() && this._validateIOInstance();
        // console.log(`🏥 [GlobalSocketManager] Health check: ${healthy ? 'HEALTHY' : 'UNHEALTHY'}`);

        if (!healthy) {
            this._logDebugInfo();
        }

        return healthy;
    }
}

// Enhanced singleton factory with better error handling
function getGlobalSocketManager() {
    let instance = global[GLOBAL_SOCKET_KEY];

    if (!instance) {
        // console.log('🆕 [GlobalSocketManager] Creating new singleton instance');
        instance = new GlobalSocketManager();
        global[GLOBAL_SOCKET_KEY] = instance;
    } else {
        // console.log('♻️ [GlobalSocketManager] Using existing singleton instance');

        // Validate the existing instance
        if (!instance._validateIOInstance) {
            console.warn('⚠️ [GlobalSocketManager] Invalid global instance, creating new one');
            instance = new GlobalSocketManager();
            global[GLOBAL_SOCKET_KEY] = instance;
        }
    }

    return instance;
}

// Export the singleton instance
export const globalSocketManager = getGlobalSocketManager();

// Export the class as well for typing purposes
export { GlobalSocketManager };

// Enhanced helper function to ensure the manager is initialized before use
export const ensureSocketManager = async () => {
    const manager = getGlobalSocketManager();

    if (!manager.isInitialized()) {
        // console.error('❌ Socket.IO manager not initialized. Make sure to call globalSocketManager.initialize() in your server setup.');
        manager._logDebugInfo();

        // Wait a bit and try recovery one more time
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!manager.isInitialized()) {
            throw new Error('Socket.IO manager not initialized. Make sure to call globalSocketManager.initialize() in your server setup.');
        }
    }

    return manager;
};

// Enhanced helper functions for common operations with automatic recovery
export const emitToUser = async (userId, event, data) => {
    const manager = getGlobalSocketManager();
    return await manager.emitToUser(userId, event, data);
};

export const emitToConversation = (conversationId, event, data) => {
    const manager = getGlobalSocketManager();
    return manager.emitToConversation(conversationId, event, data);
};

export const getSocketIO = () => {
    const manager = getGlobalSocketManager();
    return manager.getIO();
};

// New: Global health check function
export const performHealthCheck = () => {
    const manager = getGlobalSocketManager();
    return manager.healthCheck();
};