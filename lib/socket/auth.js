import jwt from 'jsonwebtoken';

export async function authenticateSocket(socket, next) {
    try {
        const token = socket.handshake.auth.token ||
            socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return next(new Error('Authentication token required'));
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET not configured');
            return next(new Error('Server configuration error'));
        }

        const decoded = jwt.verify(token, jwtSecret);

        if (!decoded.userId || !decoded.username) {
            return next(new Error('Invalid token payload'));
        }

        // Attach user data to socket
        socket.data = {
            userId: decoded.userId,
            username: decoded.username,
            authenticated: true,
        };

        next();
    } catch (error) {
        console.error('Socket authentication error:', error);

        if (error instanceof jwt.JsonWebTokenError) {
            return next(new Error('Invalid token'));
        } else if (error instanceof jwt.TokenExpiredError) {
            return next(new Error('Token expired'));
        } else {
            return next(new Error('Authentication failed'));
        }
    }
}

export function requireAuth(socket, callback) {
    if (!socket.data?.authenticated || !socket.data?.userId) {
        const error = 'Authentication required';
        if (callback) {
            callback(error);
        } else {
            socket.emit('error', { message: error, code: 'AUTH_REQUIRED' });
        }
        return false;
    }
    return true;
}

export function getUserFromSocket(socket) {
    if (!socket.data?.authenticated || !socket.data?.userId) {
        return null;
    }

    return {
        userId: socket.data.userId,
        username: socket.data.username,
    };
}