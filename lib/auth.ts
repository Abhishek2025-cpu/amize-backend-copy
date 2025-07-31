import jwt from 'jsonwebtoken';

import { prisma } from '@/lib/prisma';

// Define the authenticated user type
export interface AuthUser {
    userId: string;
    email: string;
    role: string;
    username: string;
}

/**
 * Extract and verify the JWT token from the request
 * @param request The incoming request
 * @returns The token string or null if not found
 */
export function extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.split(' ')[1];
}

/**
 * Verify and decode the JWT token
 * @param token The JWT token string
 * @returns The decoded token payload or null if invalid
 */
export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
        return null;
    }
}

/**
 * Get the authenticated user from the request
 * @param request The incoming request
 * @returns The authenticated user object or null if not authenticated
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
    const token = extractToken(request);

    if (!token) {
        return null;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return null;
    }

    // Ensure the decoded token has the expected format
    if (!decoded.userId || !decoded.email || !decoded.role || !decoded.username) {
        return null;
    }

    // Optionally verify the user still exists and is active
    try {
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user || user.deactivatedAt) {
            return null;
        }

        // Return the authenticated user
        return {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            username: decoded.username
        };
    } catch (error) {
        console.error('Error verifying user:', error);
        return null;
    }
}

/**
 * Check if the authenticated user has one of the required roles
 * @param authUser The authenticated user
 * @param requiredRoles Array of allowed roles
 * @returns True if the user has one of the required roles
 */
export function hasRole(authUser: AuthUser | null, requiredRoles: string[]): boolean {
    if (!authUser) {
        return false;
    }

    return requiredRoles.includes(authUser.role);
}

/**
 * Check if the authenticated user has the creator role
 * @param authUser The authenticated user
 * @returns True if the user is a creator or admin
 */
export function isCreator(authUser: AuthUser | null): boolean {
    if (!authUser) {
        return false;
    }

    return authUser.role === 'CREATOR' || authUser.role === 'ADMIN';
}

/**
 * Check if the authenticated user has admin role
 * @param authUser The authenticated user
 * @returns True if the user is an admin
 */
export function isAdmin(authUser: AuthUser | null): boolean {
    if (!authUser) {
        return false;
    }

    return authUser.role === 'ADMIN';
}

/**
 * Check if the authenticated user is the owner of a resource
 * @param authUser The authenticated user
 * @param ownerId The ID of the resource owner
 * @returns True if the user is the owner
 */
export function isOwner(authUser: AuthUser | null, ownerId: string): boolean {
    if (!authUser) {
        return false;
    }

    return authUser.userId === ownerId;
}

/**
 * Create a middleware function that requires authentication and specific roles
 * @param requiredRoles Array of allowed roles
 * @returns A middleware function
 */
export function requireAuth(requiredRoles: string[] = []) {
    return async (request: Request) => {
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (requiredRoles.length > 0 && !hasRole(authUser, requiredRoles)) {
            return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return null; // Allow the request to proceed
    };
}