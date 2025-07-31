import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import os from "os";

// Import enhanced socket handlers
import { authenticateSocket } from "./lib/socket/auth.js";
import { setupMessageHandlers } from "./lib/socket/messageHandler.js";
import { setupTypingHandlers, typingManager } from "./lib/socket/typingHandler.js";
import { setupNotificationHandlers } from "./lib/socket/notificationSocketHandlers.js";
import { connectionManager } from "./lib/socket/connectionManager.js";
import { globalSocketManager, performHealthCheck } from "./lib/socket/globalSocketManager.js";
import { notificationManager } from "./lib/socket/notificationHandler.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

console.log(`🚀 Starting enhanced server in ${dev ? 'development' : 'production'} mode...`);

// Enhanced IP detection
function getIp() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

// Enhanced Socket.IO setup with comprehensive error handling and logging
async function setupSocketIO(httpServer) {
    console.log('🔌 Setting up enhanced Socket.IO server...');

    try {
        // Create Socket.IO server with enhanced configuration
        const io = new SocketIOServer(httpServer, {
            cors: {
                origin: dev ? "*" : process.env.FRONTEND_URL,
                methods: ["GET", "POST"],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000,
            transports: ['websocket', 'polling'],
            allowEIO3: true,
            // Enhanced options for better reliability
            maxHttpBufferSize: 1e6, // 1MB
            httpCompression: true,
            perMessageDeflate: true
        });

        console.log('✅ Socket.IO server created with enhanced configuration');

        // 🔥 CRITICAL: Initialize global socket manager with enhanced error handling
        console.log('🚀 Initializing Enhanced Global Socket Manager...');
        console.log('🔍 Pre-initialization health check...');

        const preInitHealth = performHealthCheck();
        console.log('📊 Pre-initialization health:', preInitHealth);

        const initSuccess = await globalSocketManager.initialize(io);

        if (!initSuccess) {
            console.error('❌ Failed to initialize Enhanced Global Socket Manager');
            throw new Error('Enhanced socket manager initialization failed');
        }

        console.log('✅ Enhanced Global Socket Manager initialized successfully');

        // Comprehensive post-initialization verification
        console.log('🔍 Post-initialization verification...');
        const postInitHealth = performHealthCheck();
        const stats = globalSocketManager.getStats();

        console.log('📊 Enhanced Socket Manager Stats:', stats);
        console.log('🏥 Post-initialization health:', postInitHealth);

        if (!postInitHealth) {
            console.error('❌ Socket manager failed health check after initialization');
            throw new Error('Socket manager unhealthy after initialization');
        }

        // Enhanced authentication middleware with logging
        io.use((socket, next) => {
            console.log(`🔐 Authenticating socket ${socket.id}...`);
            authenticateSocket(socket, (error) => {
                if (error) {
                    console.error(`❌ Socket ${socket.id} authentication failed:`, error.message);
                    next(error);
                } else {
                    const user = socket.data;
                    console.log(`✅ Socket ${socket.id} authenticated for user ${user.username} (${user.userId})`);
                    next();
                }
            });
        });

        // Enhanced connection handling with comprehensive logging
        io.on('connection', async (socket) => {
            const startTime = Date.now();
            console.log(`🔗 Enhanced connection handler - Socket connected: ${socket.id}`);

            try {
                const user = socket.data;
                if (!user) {
                    console.error(`❌ No user data found for socket ${socket.id}`);
                    socket.disconnect();
                    return;
                }

                console.log(`👤 Processing connection for user ${user.username} (${user.userId}) via socket ${socket.id}`);

                // Step 1: Enhanced ConnectionManager registration with immediate verification
                console.log(`🔧 Step 1: Registering with Enhanced ConnectionManager...`);
                await connectionManager.handleConnection(socket, io);

                // Immediate verification
                const isOnlineAfterRegistration = connectionManager.isUserOnline(user.userId);
                console.log(`🔍 User ${user.username} online status after ConnectionManager registration: ${isOnlineAfterRegistration}`);

                if (!isOnlineAfterRegistration) {
                    console.error(`❌ CRITICAL: User ${user.username} not showing as online after ConnectionManager registration!`);
                    connectionManager.logDebugState(user.userId);

                    // Attempt immediate recovery
                    console.log(`🔄 Attempting immediate recovery for user ${user.username}...`);
                    connectionManager.forceRefreshUserStatus(user.userId);

                    const recoveredStatus = connectionManager.isUserOnline(user.userId);
                    console.log(`🔍 Recovery result for ${user.username}: ${recoveredStatus}`);
                }

                // Step 2: Setup enhanced event handlers
                console.log(`🔧 Step 2: Setting up enhanced event handlers...`);
                setupMessageHandlers(socket, io);
                setupTypingHandlers(socket, io);
                setupNotificationHandlers(socket, io);

                // Step 3: Enhanced status and activity handlers
                socket.on('update_status', async (data) => {
                    console.log(`📊 Status update from ${socket.id} (${user.username}):`, data);
                    connectionManager.updateUserActivity(socket);
                });

                // Step 4: Enhanced conversation room management with verification
                socket.on('join_conversation', (data) => {
                    const { conversationId } = data;
                    if (conversationId) {
                        socket.join(`conversation:${conversationId}`);
                        console.log(`🏠 Socket ${socket.id} (${user.username}) joined conversation: ${conversationId}`);

                        // Verify the join was successful
                        const rooms = Array.from(socket.rooms);
                        console.log(`🔍 Socket ${socket.id} rooms after join:`, rooms);
                    }
                });

                socket.on('leave_conversation', (data) => {
                    const { conversationId } = data;
                    if (conversationId) {
                        socket.leave(`conversation:${conversationId}`);
                        console.log(`🚪 Socket ${socket.id} (${user.username}) left conversation: ${conversationId}`);

                        // Verify the leave was successful
                        const rooms = Array.from(socket.rooms);
                        console.log(`🔍 Socket ${socket.id} rooms after leave:`, rooms);
                    }
                });

                // Step 5: Enhanced health check endpoint for clients
                socket.on('health_check', (data, callback) => {
                    console.log(`🏥 Health check requested by ${user.username} (${socket.id})`);

                    const health = {
                        socket: {
                            id: socket.id,
                            connected: socket.connected,
                            rooms: Array.from(socket.rooms)
                        },
                        user: {
                            id: user.userId,
                            username: user.username,
                            onlineStatus: connectionManager.isUserOnline(user.userId),
                            connections: connectionManager.getUserConnections(user.userId).size
                        },
                        server: {
                            globalSocketManagerHealth: performHealthCheck(),
                            stats: globalSocketManager.getStats(),
                            notificationQueueSize: notificationManager.getQueueStats().queueSize
                        },
                        timestamp: new Date().toISOString()
                    };

                    console.log(`📊 Health check results for ${user.username}:`, health);
                    callback?.(health);
                });

                // Step 6: Enhanced disconnection handling with cleanup verification
                socket.on('disconnect', async (reason) => {
                    const disconnectTime = Date.now();
                    console.log(`❌ Enhanced disconnect handler - Socket ${socket.id} (${user.username}) disconnected, reason: ${reason}`);
                    console.log(`⏱️ Connection duration: ${disconnectTime - startTime}ms`);

                    try {
                        // Enhanced typing cleanup
                        typingManager.cleanupUserTyping(user.userId, io);

                        // Enhanced connection cleanup with verification
                        await connectionManager.handleDisconnection(socket, io);

                        // Verify cleanup was successful
                        const stillOnline = connectionManager.isUserOnline(user.userId);
                        const remainingConnections = connectionManager.getUserConnections(user.userId).size;

                        console.log(`🔍 Disconnect cleanup verification for ${user.username}:`, {
                            stillOnline,
                            remainingConnections,
                            reason
                        });

                    } catch (error) {
                        console.error('💥 Error in enhanced disconnect handler:', error);
                    }
                });

                // Enhanced error handling with detailed logging
                socket.on('error', (error) => {
                    console.error('💥 Enhanced socket error:', {
                        socketId: socket.id,
                        userId: user.userId,
                        username: user.username,
                        error: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString()
                    });
                });

                // Final verification of connection setup
                const setupTime = Date.now() - startTime;
                const finalOnlineStatus = connectionManager.isUserOnline(user.userId);
                const finalConnections = connectionManager.getUserConnections(user.userId).size;

                console.log(`✅ Enhanced connection setup completed for ${user.username}:`, {
                    socketId: socket.id,
                    setupTimeMs: setupTime,
                    finalOnlineStatus,
                    finalConnections,
                    socketRooms: Array.from(socket.rooms)
                });

                // Log a success marker for easy log parsing
                console.log(`🎉 CONNECTION_SUCCESS: ${user.username} (${user.userId}) via ${socket.id}`);

            } catch (error) {
                console.error('💥 Error in enhanced socket connection handler:', error);
                console.error('💥 Error stack:', error.stack);

                // Log a failure marker for easy log parsing
                console.log(`💥 CONNECTION_FAILURE: Socket ${socket.id} - ${error.message}`);

                socket.disconnect();
            }
        });

        // Enhanced connection monitoring
        io.engine.on('connection_error', (err) => {
            console.error('💥 Socket.IO connection error:', {
                message: err.message,
                description: err.description,
                context: err.context,
                type: err.type
            });
        });

        console.log('✅ Enhanced Socket.IO connection handlers setup complete');

        return io;

    } catch (error) {
        console.error('💥 Failed to setup enhanced Socket.IO:', error);
        throw error;
    }
}

// Enhanced server startup with comprehensive monitoring
app.prepare().then(async () => {
    const httpServer = createServer(handler);

    try {
        console.log('🔧 Setting up enhanced HTTP server...');

        // Setup enhanced Socket.IO with proper error handling
        const io = await setupSocketIO(httpServer);

        // Enhanced final verification
        console.log('🔍 Enhanced final verification...');
        const isInitialized = globalSocketManager.isInitialized();
        const healthCheck = performHealthCheck();
        const finalStats = globalSocketManager.getStats();

        console.log('📊 Enhanced Final Socket Manager Status:', {
            initialized: isInitialized,
            healthy: healthCheck,
            stats: finalStats
        });

        if (!isInitialized || !healthCheck) {
            throw new Error('Enhanced socket manager not properly initialized or unhealthy after setup');
        }

        // Enhanced server startup
        httpServer
            .once("error", (err) => {
                console.error('💥 Enhanced server error:', err);
                process.exit(1);
            })
            .listen(port, () => {
                console.log('🎉 Enhanced server startup complete!');
                console.log(`🚀 Ready on http://${hostname}:${port}`);
                console.log(`🔌 Enhanced Socket.IO server running on port ${port}`);
                console.log(`🌐 Online on the local network at http://${getIp()}:${port}`);

                // Enhanced startup verification
                const startupStats = globalSocketManager.getStats();
                const startupHealth = performHealthCheck();
                const notificationStats = notificationManager.getQueueStats();

                console.log('📊 Enhanced Startup Stats:', {
                    socketManager: startupStats,
                    health: startupHealth,
                    notifications: notificationStats,
                    connectionManager: {
                        activeUsers: connectionManager.getOnlineUsers().length
                    }
                });

                // Log startup success marker
                console.log('🎉 ENHANCED_SERVER_READY: All systems operational');

                // Start periodic health monitoring in development
                if (dev) {
                    setInterval(() => {
                        const health = performHealthCheck();
                        const stats = globalSocketManager.getStats();
                        const queueStats = notificationManager.getQueueStats();

                        if (!health || queueStats.queueSize > 10) {
                            console.log('⚠️ Health monitor alert:', {
                                health,
                                queueSize: queueStats.queueSize,
                                stats: stats.stats
                            });
                        }
                    }, 30000); // Every 30 seconds
                }
            });

    } catch (error) {
        console.error('💥 Failed to setup enhanced server:', error);
        console.error('💥 Error stack:', error.stack);
        process.exit(1);
    }

    // Enhanced graceful shutdown with comprehensive cleanup
    const enhancedGracefulShutdown = (signal) => {
        console.log(`⚡ Enhanced shutdown: ${signal} received, shutting down gracefully...`);

        try {
            // Stop notification retry processor
            console.log('🔔 Stopping notification manager...');
            notificationManager.cleanup();

            // Cleanup connection manager
            console.log('🔗 Cleaning up connection manager...');
            connectionManager.cleanup();

            // Cleanup socket manager
            console.log('🔌 Cleaning up socket manager...');
            globalSocketManager.cleanup();

            console.log('✅ Enhanced cleanup completed');

            httpServer.close(() => {
                console.log('✅ Enhanced server closed gracefully');
                process.exit(0);
            });

            // Force exit after timeout
            setTimeout(() => {
                console.log('⚠️ Enhanced forced shutdown after timeout');
                process.exit(1);
            }, 10000);

        } catch (error) {
            console.error('💥 Error during enhanced shutdown:', error);
            process.exit(1);
        }
    };

    // Enhanced signal handlers
    process.on('SIGTERM', () => enhancedGracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => enhancedGracefulShutdown('SIGINT'));

    // Enhanced error handlers
    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 Enhanced Unhandled Rejection at:', promise, 'reason:', reason);
        console.error('💥 Stack trace:', reason?.stack);

        // In development, we want to see these errors clearly
        if (dev) {
            console.error('💥 Development mode - logging full error details');
            console.error('💥 Reason type:', typeof reason);
            console.error('💥 Reason string:', String(reason));
        }

        // Don't exit in production, just log
        if (!dev) {
            console.error('💥 Production mode - continuing after unhandled rejection');
        }
    });

    process.on('uncaughtException', (error) => {
        console.error('💥 Enhanced Uncaught Exception:', error);
        console.error('💥 Stack trace:', error.stack);

        // Always exit on uncaught exceptions
        enhancedGracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Enhanced warning handler
    process.on('warning', (warning) => {
        console.warn('⚠️ Enhanced Process Warning:', {
            name: warning.name,
            message: warning.message,
            stack: warning.stack
        });
    });

    console.log('✅ Enhanced error handlers and signal handlers setup complete');
});

// Enhanced exports for potential external use
export { globalSocketManager, connectionManager, notificationManager };