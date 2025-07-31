import { getUserFromSocket, requireAuth } from './auth.js';

class TypingManager {
    constructor() {
        this.typingStates = new Map();
        this.TYPING_TIMEOUT = 3000; // 3 seconds
    }

    handleTypingStart(socket, data, io) {
        if (!requireAuth(socket)) return;

        const user = getUserFromSocket(socket);
        if (!user) return;

        const { conversationId, receiverId } = data;
        const typingKey = `${user.userId}-${conversationId}`;

        // Clear existing timeout
        const existingState = this.typingStates.get(typingKey);
        if (existingState?.timeout) {
            clearTimeout(existingState.timeout);
        }

        // Create new typing state
        const typingState = {
            userId: user.userId,
            username: user.username,
            conversationId,
            startedAt: new Date(),
        };

        // Set auto-stop timeout
        typingState.timeout = setTimeout(() => {
            this.handleTypingStop(socket, { conversationId, receiverId }, io, true);
        }, this.TYPING_TIMEOUT);

        this.typingStates.set(typingKey, typingState);

        // Broadcast to receiver
        io.to(`user:${receiverId}`).emit('typing_start', {
            conversationId,
            userId: user.userId,
            username: user.username,
        });
    }

    handleTypingStop(socket, data, io, isTimeout = false) {
        if (!isTimeout && !requireAuth(socket)) return;

        const user = getUserFromSocket(socket);
        if (!user) return;

        const { conversationId, receiverId } = data;
        const typingKey = `${user.userId}-${conversationId}`;

        const typingState = this.typingStates.get(typingKey);
        if (!typingState) return;

        // Clear timeout
        if (typingState.timeout) {
            clearTimeout(typingState.timeout);
        }

        // Remove typing state
        this.typingStates.delete(typingKey);

        // Broadcast stop to receiver
        io.to(`user:${receiverId}`).emit('typing_stop', {
            conversationId,
            userId: user.userId,
            username: user.username,
        });
    }

    cleanupUserTyping(userId, io) {
        const keysToDelete = [];

        this.typingStates.forEach((state, key) => {
            if (state.userId === userId) {
                if (state.timeout) {
                    clearTimeout(state.timeout);
                }
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => {
            this.typingStates.delete(key);
        });
    }
}

export const typingManager = new TypingManager();

export function setupTypingHandlers(socket, io) {
    socket.on('typing_start', (data) => {
        typingManager.handleTypingStart(socket, data, io);
    });

    socket.on('typing_stop', (data) => {
        typingManager.handleTypingStop(socket, data, io);
    });
}