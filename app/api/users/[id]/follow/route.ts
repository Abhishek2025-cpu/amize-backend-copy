/**
 * @swagger
 * /users/{id}/follow:
 *   post:
 *     summary: Follow a user
 *     description: >
 *       Allows the authenticated user to follow another user and sends a notification.
 *     tags:
 *       - Social
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to follow
 *     responses:
 *       201:
 *         description: Successfully followed user
 *       400:
 *         description: Invalid request (already following)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Unfollow a user
 *     description: >
 *       Allows the authenticated user to unfollow a user they currently follow.
 *     tags:
 *       - Social
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to unfollow
 *     responses:
 *       200:
 *         description: Successfully unfollowed user
 *       400:
 *         description: Invalid request (not currently following)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { notificationManager } from '@/lib/socket/notificationHandler';

import { prisma } from '@/lib/prisma';

// Follow a user
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const targetUserId = params.id;

        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log(`[FollowRoute] User ${authUser.userId} attempting to follow ${targetUserId}`);

        // Prevent following yourself
        if (authUser.userId === targetUserId) {
            return NextResponse.json(
                { success: false, message: 'You cannot follow yourself' },
                { status: 400 }
            );
        }

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                username: true,
                profilePhotoUrl: true
            },
        });

        if (!targetUser) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: authUser.userId,
                    followingId: targetUserId,
                },
            },
        });

        if (existingFollow) {
            return NextResponse.json(
                { success: false, message: 'You are already following this user' },
                { status: 400 }
            );
        }

        // Create follow relationship in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create follow relationship
            const follow = await tx.follow.create({
                data: {
                    followerId: authUser.userId,
                    followingId: targetUserId,
                },
            });

            // Get follower counts for response
            const followingCount = await tx.follow.count({
                where: { followerId: authUser.userId },
            });

            const followerCount = await tx.follow.count({
                where: { followingId: targetUserId },
            });

            return { follow, followingCount, followerCount };
        });

        console.log(`[FollowRoute] Follow relationship created: ${authUser.userId} -> ${targetUserId}`);

        // 🔥 NEW: Send follow notification asynchronously
        // We don't await this to avoid blocking the response
        notificationManager.sendFollowNotification(authUser.userId, targetUserId)
            .then((notification) => {
                if (notification) {
                    console.log(`[FollowRoute] Follow notification sent successfully: ${notification}`);
                } else {
                    console.log(`[FollowRoute] Follow notification not sent (user settings or other reason)`);
                }
            })
            .catch((error) => {
                console.error(`[FollowRoute] Error sending follow notification:`, error);
            });

        return NextResponse.json(
            {
                success: true,
                message: `You are now following ${targetUser.username}`,
                follow: {
                    id: result.follow.id,
                    createdAt: result.follow.createdAt,
                },
                stats: {
                    followingCount: result.followingCount,
                    followerCount: result.followerCount,
                },
                targetUser: {
                    id: targetUser.id,
                    username: targetUser.username,
                    profilePhotoUrl: targetUser.profilePhotoUrl
                }
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('[FollowRoute] Follow user error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Unfollow a user
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const targetUserId = params.id;

        // Get authenticated user from token
        const authUser = await getAuthUser(request);

        if (!authUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log(`[FollowRoute] User ${authUser.userId} attempting to unfollow ${targetUserId}`);

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                username: true,
                profilePhotoUrl: true
            },
        });

        if (!targetUser) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Check if actually following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: authUser.userId,
                    followingId: targetUserId,
                },
            },
        });

        if (!existingFollow) {
            return NextResponse.json(
                { success: false, message: 'You are not following this user' },
                { status: 400 }
            );
        }

        // Delete follow relationship in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Delete follow relationship
            await tx.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: authUser.userId,
                        followingId: targetUserId,
                    },
                },
            });

            // Get updated follower counts
            const followingCount = await tx.follow.count({
                where: { followerId: authUser.userId },
            });

            const followerCount = await tx.follow.count({
                where: { followingId: targetUserId },
            });

            return { followingCount, followerCount };
        });

        console.log(`[FollowRoute] Follow relationship deleted: ${authUser.userId} -> ${targetUserId}`);

        return NextResponse.json(
            {
                success: true,
                message: `You have unfollowed ${targetUser.username}`,
                stats: {
                    followingCount: result.followingCount,
                    followerCount: result.followerCount,
                },
                targetUser: {
                    id: targetUser.id,
                    username: targetUser.username,
                    profilePhotoUrl: targetUser.profilePhotoUrl
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('[FollowRoute] Unfollow user error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Get follow status and counts
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const targetUserId = params.id;

        // Get authenticated user from token (optional for this endpoint)
        const authUser = await getAuthUser(request);

        console.log(`[FollowRoute] Getting follow status for user ${targetUserId}`);

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                username: true,
                profilePhotoUrl: true
            },
        });

        if (!targetUser) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Get follower and following counts
        const followerCount = await prisma.follow.count({
            where: { followingId: targetUserId },
        });

        const followingCount = await prisma.follow.count({
            where: { followerId: targetUserId },
        });

        // Check if authenticated user is following target
        let isFollowing = false;
        let mutualFollow = false;

        if (authUser) {
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: authUser.userId,
                        followingId: targetUserId,
                    },
                },
            });
            isFollowing = !!follow;

            // Check if it's a mutual follow (target user also follows current user)
            if (isFollowing) {
                const reverseFollow = await prisma.follow.findUnique({
                    where: {
                        followerId_followingId: {
                            followerId: targetUserId,
                            followingId: authUser.userId,
                        },
                    },
                });
                mutualFollow = !!reverseFollow;
            }
        }

        return NextResponse.json(
            {
                success: true,
                follow: {
                    isFollowing,
                    mutualFollow,
                    stats: {
                        followers: followerCount,
                        following: followingCount,
                    },
                },
                targetUser: {
                    id: targetUser.id,
                    username: targetUser.username,
                    profilePhotoUrl: targetUser.profilePhotoUrl
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('[FollowRoute] Get follow status error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}