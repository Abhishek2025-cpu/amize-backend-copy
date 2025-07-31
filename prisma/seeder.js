import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// Configuration
const USERS_COUNT = 50;
const VIDEOS_PER_USER_MIN = 1;
const VIDEOS_PER_USER_MAX = 5;
const COMMENTS_PER_VIDEO_MIN = 0;
const COMMENTS_PER_VIDEO_MAX = 10;
const LIKES_PER_VIDEO_MIN = 0;
const LIKES_PER_VIDEO_MAX = 20;
const SHARES_PER_VIDEO_MIN = 0;
const SHARES_PER_VIDEO_MAX = 5;
const VIEWS_PER_VIDEO_MIN = 10;
const VIEWS_PER_VIDEO_MAX = 100;
const MAX_FOLLOW_PERCENTAGE = 0.3; // Max percentage of users each user follows
const PASSWORD = 'password'; // Common password for all users

// Predefined data arrays
const interests = [
    'Comedy', 'Music', 'Dance', 'Food', 'Travel', 'Fashion', 'Beauty',
    'Fitness', 'Sports', 'Gaming', 'Technology', 'Education', 'DIY',
    'Animals', 'Nature', 'Art', 'Entertainment', 'Lifestyle'
];

const soundTitles = [
    'Summer Vibes', 'Dance Beat', 'Chill Wave', 'Trending Sound', 'Epic Drop',
    'Acoustic Melody', 'Viral Tune', 'Happy Days', 'Emotional Ballad', 'Party Mix'
];

const videoTitles = [
    'Check this out!', 'How to make perfect pasta', 'My morning routine',
    'Dance tutorial', 'Funny moments with my dog', 'Travel vlog: Paris',
    'Outfit of the day', '10-minute workout', 'Gaming highlights',
    'Tech review', 'Study with me', 'DIY home decor', 'My new single',
    'Life hacks you need to know', 'A day in my life'
];

const sharePlatforms = ['whatsapp', 'facebook', 'instagram', 'twitter', 'copy_link'];

const reportReasons = [
    'inappropriate content', 'spam', 'harassment', 'hate speech',
    'violent content', 'copyright violation', 'misinformation'
];

const deviceModels = [
    'iPhone 13', 'iPhone 14', 'iPhone 15', 'Samsung Galaxy S22',
    'Samsung Galaxy S23', 'Google Pixel 6', 'Google Pixel 7',
    'OnePlus 10', 'Xiaomi Mi 11', 'iPad Pro'
];

const osVersions = [
    'iOS 15.4', 'iOS 16.0', 'iOS 16.2', 'Android 12', 'Android 13',
    'iPadOS 15.4', 'iPadOS 16.0'
];

const appVersions = ['1.0.0', '1.1.0', '1.2.0', '1.2.1', '1.3.0'];

// Helper functions
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const getRandomArraySubset = (array, maxItems) => {
    const count = Math.floor(Math.random() * maxItems) + 1;
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
const getRandomBool = (probability = 0.5) => Math.random() < probability;

async function seed() {
    console.log('Starting seeding process...');

    try {
        // Clean up existing data (in reverse order of dependencies)
        console.log('Cleaning up existing data...');
        await prisma.subscriptionPayment.deleteMany({});
        await prisma.userSubscription.deleteMany({});
        await prisma.subscriptionPlan.deleteMany({});
        await prisma.videoInsight.deleteMany({});
        await prisma.deviceHistory.deleteMany({});
        await prisma.upload.deleteMany({});
        await prisma.conversationUser.deleteMany({});
        await prisma.conversation.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.message.deleteMany({});
        await prisma.report.deleteMany({});
        await prisma.viewHistory.deleteMany({});
        await prisma.share.deleteMany({});
        await prisma.comment.deleteMany({});
        await prisma.like.deleteMany({});
        await prisma.soundStore.deleteMany({});
        await prisma.video.deleteMany({});
        await prisma.sound.deleteMany({});
        await prisma.follow.deleteMany({});
        await prisma.userSettings.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.interest.deleteMany({});

        // 1. Create interests
        console.log('Creating interests...');
        const interestRecords = await Promise.all(
            interests.map(name =>
                prisma.interest.create({
                    data: { name }
                })
            )
        );

        // 2. Create sounds
        console.log('Creating sounds...');
        const soundRecords = await Promise.all(
            soundTitles.map(title =>
                prisma.sound.create({
                    data: {
                        title,
                        artistName: faker.person.fullName(),
                        soundUrl: `https://example.com/sounds/${faker.string.uuid()}.mp3`,
                        duration: faker.number.float({ min: 15, max: 60, precision: 0.1 }),
                        isOriginal: getRandomBool(0.3)
                    }
                })
            )
        );

        // 3. Create users
        console.log(`Creating ${USERS_COUNT} users...`);
        // Hash password once for all users
        const passwordHash = await bcrypt.hash(PASSWORD, 10);

        const users = [];
        for (let i = 0; i < USERS_COUNT; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const username = `${firstName.toLowerCase()}${faker.number.int({ min: 1, max: 999 })}`;
            const email = faker.internet.email({ firstName, lastName });

            // Determine user type
            const isCreator = getRandomBool(0.2);
            const isAdmin = getRandomBool(0.05);
            let role = 'USER';
            if (isAdmin) role = 'ADMIN';
            else if (isCreator) role = 'CREATOR';

            // Random subset of interests
            const userInterests = getRandomArraySubset(interestRecords, 5);

            const user = await prisma.user.create({
                data: {
                    username,
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    fullName: `${firstName} ${lastName}`,
                    bio: faker.person.bio(),
                    profilePhotoUrl: faker.image.avatar(),
                    phoneNumber: faker.phone.number(),
                    address: faker.location.streetAddress(),
                    dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
                    gender: getRandomItem(['Male', 'Female', 'Non-binary']),
                    verified: getRandomBool(0.8),

                    // Role-specific fields
                    role,
                    creatorVerified: isCreator && getRandomBool(0.3),
                    creatorCategory: isCreator ? getRandomItem(interests) : null,
                    monetizationEnabled: isCreator && getRandomBool(0.7),
                    adminPermissions: isAdmin ? JSON.stringify(['manage_users', 'manage_content', 'manage_reports']) : null,

                    // Connect interests
                    interests: {
                        connect: userInterests.map(interest => ({ id: interest.id }))
                    },

                    // Create user settings
                    settings: {
                        create: {
                            // Social media handles
                            instagramHandle: getRandomBool(0.7) ? `${username}_ig` : null,
                            twitterHandle: getRandomBool(0.6) ? `${username}_tw` : null,
                            facebookHandle: getRandomBool(0.5) ? `${username}_fb` : null,

                            // Account settings
                            isPrivate: getRandomBool(0.1),
                            isBusinessAccount: isCreator && getRandomBool(0.6),
                            language: getRandomItem(['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']),

                            // Security settings
                            useFingerprint: getRandomBool(0.5),
                            useFaceId: getRandomBool(0.4),

                            // Creator settings (if creator)
                            creatorSubscriptionPrice: isCreator ? faker.number.float({ min: 4.99, max: 49.99, precision: 0.01 }) : null,
                            minSubscriptionAmount: isCreator ? faker.number.float({ min: 1, max: 5, precision: 0.01 }) : null,
                            maxSubscriptionAmount: isCreator ? faker.number.float({ min: 50, max: 100, precision: 0.01 }) : null,
                        }
                    },

                    // Timestamps
                    lastLoginAt: faker.date.recent(),
                    deactivatedAt: getRandomBool(0.02) ? faker.date.recent() : null
                }
            });

            users.push(user);
        }

        // 4. Create follow relationships
        console.log('Creating follow relationships...');
        const follows = [];
        for (const follower of users) {
            // Each user follows a random subset of users
            const maxFollows = Math.floor(users.length * MAX_FOLLOW_PERCENTAGE);
            const followCount = getRandomInt(0, maxFollows);

            // Get random users to follow (excluding self)
            const potentialFollowings = users.filter(u => u.id !== follower.id);
            const shuffled = [...potentialFollowings].sort(() => 0.5 - Math.random());
            const selectedFollowings = shuffled.slice(0, followCount);

            for (const following of selectedFollowings) {
                try {
                    const follow = await prisma.follow.create({
                        data: {
                            followerId: follower.id,
                            followingId: following.id
                        }
                    });
                    follows.push(follow);
                } catch (error) {
                    // Skip duplicate follows
                    console.log(`Skipping duplicate follow: ${follower.id} -> ${following.id}`);
                }
            }
        }

        // 5. Create videos for users
        console.log('Creating videos...');
        const videos = [];
        for (const user of users) {
            const videoCount = getRandomInt(VIDEOS_PER_USER_MIN, VIDEOS_PER_USER_MAX);

            for (let i = 0; i < videoCount; i++) {
                // Randomly assign a sound or leave it null
                const useSound = getRandomBool(0.8);
                const soundId = useSound ? getRandomItem(soundRecords).id : null;

                const video = await prisma.video.create({
                    data: {
                        title: getRandomItem(videoTitles),
                        description: faker.lorem.paragraph(),
                        videoUrl: `https://example.com/videos/${faker.string.uuid()}.mp4`,
                        thumbnailUrl: `https://example.com/thumbnails/${faker.string.uuid()}.jpg`,
                        duration: faker.number.float({ min: 5, max: 60, precision: 0.1 }),
                        isPublic: getRandomBool(0.9),
                        soundId,
                        userId: user.id,
                        createdAt: faker.date.recent({ days: 90 }),
                    }
                });

                videos.push(video);
            }
        }

        // 6. Create SoundStore entries (saved sounds for users)
        console.log('Creating sound store entries...');
        for (const user of users) {
            // Each user saves a few random sounds
            const saveSoundCount = getRandomInt(0, 5);
            const selectedSounds = getRandomArraySubset(soundRecords, saveSoundCount);

            for (const sound of selectedSounds) {
                try {
                    await prisma.soundStore.create({
                        data: {
                            userId: user.id,
                            soundId: sound.id
                        }
                    });
                } catch (error) {
                    // Skip duplicates
                    console.log(`Skipping duplicate sound store entry: ${user.id} -> ${sound.id}`);
                }
            }
        }

        // 7. Create likes on videos
        console.log('Creating likes...');
        for (const video of videos) {
            const potentialLikers = users.filter(u => u.id !== video.userId);
            const likeCount = getRandomInt(LIKES_PER_VIDEO_MIN, LIKES_PER_VIDEO_MAX);
            const selectedLikers = getRandomArraySubset(potentialLikers, likeCount);

            for (const liker of selectedLikers) {
                try {
                    await prisma.like.create({
                        data: {
                            userId: liker.id,
                            videoId: video.id
                        }
                    });
                } catch (error) {
                    // Skip duplicates
                    console.log(`Skipping duplicate like: ${liker.id} -> ${video.id}`);
                }
            }
        }

        // 8. Create comments on videos
        console.log('Creating comments...');
        const comments = [];
        for (const video of videos) {
            const commentCount = getRandomInt(COMMENTS_PER_VIDEO_MIN, COMMENTS_PER_VIDEO_MAX);

            for (let i = 0; i < commentCount; i++) {
                // Randomly select a commenter (can include video owner)
                const commenter = getRandomItem(users);

                const comment = await prisma.comment.create({
                    data: {
                        text: faker.lorem.sentence(),
                        userId: commenter.id,
                        videoId: video.id,
                        likesCount: getRandomInt(0, 20)
                    }
                });

                comments.push(comment);

                // Add some replies to comments
                if (getRandomBool(0.3)) {
                    const replyCount = getRandomInt(1, 3);

                    for (let j = 0; j < replyCount; j++) {
                        const replier = getRandomItem(users);

                        await prisma.comment.create({
                            data: {
                                text: faker.lorem.sentence(),
                                userId: replier.id,
                                videoId: video.id,
                                parentId: comment.id,
                                likesCount: getRandomInt(0, 10)
                            }
                        });
                    }
                }
            }
        }

        // 9. Create shares
        console.log('Creating shares...');
        for (const video of videos) {
            const shareCount = getRandomInt(SHARES_PER_VIDEO_MIN, SHARES_PER_VIDEO_MAX);

            for (let i = 0; i < shareCount; i++) {
                // Some shares are anonymous, some have users
                const hasUser = getRandomBool(0.7);
                const sharer = hasUser ? getRandomItem(users).id : null;

                await prisma.share.create({
                    data: {
                        videoId: video.id,
                        platform: getRandomItem(sharePlatforms),
                        userId: sharer
                    }
                });
            }
        }

        // 10. Create view history
        console.log('Creating view history...');
        for (const video of videos) {
            const viewCount = getRandomInt(VIEWS_PER_VIDEO_MIN, VIEWS_PER_VIDEO_MAX);

            for (let i = 0; i < viewCount; i++) {
                const viewer = getRandomItem(users);
                const watchTime = faker.number.float({ min: 1, max: video.duration, precision: 0.1 });
                const completionRate = (watchTime / video.duration) * 100;

                await prisma.viewHistory.create({
                    data: {
                        userId: viewer.id,
                        videoId: video.id,
                        watchTime,
                        completionRate,
                        createdAt: faker.date.recent({ days: 30 })
                    }
                });
            }
        }

        // 11. Create some reports
        console.log('Creating reports...');
        for (let i = 0; i < 20; i++) {
            const reporter = getRandomItem(users);

            // Decide whether to report a video or a user
            const reportVideo = getRandomBool();

            if (reportVideo) {
                const reportedVideo = getRandomItem(videos);

                await prisma.report.create({
                    data: {
                        reason: getRandomItem(reportReasons),
                        description: getRandomBool(0.7) ? faker.lorem.sentence() : null,
                        reportedById: reporter.id,
                        videoId: reportedVideo.id,
                        status: getRandomItem(['pending', 'reviewed', 'actioned', 'dismissed']),
                        reviewedBy: getRandomBool(0.6) ? getRandomItem(users.filter(u => u.role === 'ADMIN')).id : null,
                        actionTaken: getRandomBool(0.4) ? 'Content removed' : null,
                        reviewedAt: getRandomBool(0.6) ? faker.date.recent() : null
                    }
                });
            } else {
                const reportedUser = getRandomItem(users.filter(u => u.id !== reporter.id));

                await prisma.report.create({
                    data: {
                        reason: getRandomItem(reportReasons),
                        description: getRandomBool(0.7) ? faker.lorem.sentence() : null,
                        reportedById: reporter.id,
                        userId: reportedUser.id,
                        status: getRandomItem(['pending', 'reviewed', 'actioned', 'dismissed']),
                        reviewedBy: getRandomBool(0.6) ? getRandomItem(users.filter(u => u.role === 'ADMIN')).id : null,
                        actionTaken: getRandomBool(0.4) ? 'User warned' : null,
                        reviewedAt: getRandomBool(0.6) ? faker.date.recent() : null
                    }
                });
            }
        }

        // 12. Create conversations and messages between users
        console.log('Creating conversations and messages...');
        const conversations = [];

        // Create some conversations between random pairs of users
        for (let i = 0; i < 30; i++) {
            const participant1 = getRandomItem(users);
            const participant2 = getRandomItem(users.filter(u => u.id !== participant1.id));

            // Create conversation
            const conversation = await prisma.conversation.create({
                data: {
                    type: 'direct',
                    participants: {
                        connect: [{ id: participant1.id }, { id: participant2.id }]
                    }
                }
            });

            conversations.push(conversation);

            // Create conversation users entries
            await prisma.conversationUser.create({
                data: {
                    userId: participant1.id,
                    conversationId: conversation.id,
                    lastReadAt: faker.date.recent(),
                    notifications: true
                }
            });

            await prisma.conversationUser.create({
                data: {
                    userId: participant2.id,
                    conversationId: conversation.id,
                    lastReadAt: faker.date.recent(),
                    notifications: true
                }
            });

            // Create a thread of messages in this conversation
            const messageCount = getRandomInt(1, 10);
            let lastMessageDate = faker.date.recent({ days: 30 });
            let lastMessage = null;

            for (let j = 0; j < messageCount; j++) {
                const messageSender = j % 2 === 0 ? participant1 : participant2;
                const messageReceiver = j % 2 === 0 ? participant2 : participant1;

                // Make messages chronological, each newer than the last
                lastMessageDate = new Date(lastMessageDate.getTime() + getRandomInt(60000, 7200000)); // 1 min to 2 hours later

                const isRead = getRandomBool(0.8);
                const message = await prisma.message.create({
                    data: {
                        content: faker.lorem.sentences({ min: 1, max: 3 }),
                        senderId: messageSender.id,
                        receiverId: messageReceiver.id,
                        conversationId: conversation.id,
                        isRead,
                        readAt: isRead ? new Date(lastMessageDate.getTime() + getRandomInt(60000, 300000)) : null, // 1-5 minutes after message
                        createdAt: lastMessageDate,
                        updatedAt: lastMessageDate
                    }
                });

                lastMessage = message;
            }

            // Update conversation with last message info
            if (lastMessage) {
                await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: {
                        lastMessageId: lastMessage.id,
                        lastMessageContent: lastMessage.content,
                        lastMessageAt: lastMessage.createdAt,
                        lastMessageSender: lastMessage.senderId
                    }
                });
            }
        }

        // 13. Create notifications
        console.log('Creating notifications...');
        // Create various types of notifications
        const notificationTypes = [
            { type: 'like', message: 'liked your video' },
            { type: 'comment', message: 'commented on your video' },
            { type: 'follow', message: 'started following you' },
            { type: 'mention', message: 'mentioned you in a comment' }
        ];

        for (const user of users) {
            const notificationCount = getRandomInt(0, 10);

            for (let i = 0; i < notificationCount; i++) {
                const notificationType = getRandomItem(notificationTypes);
                const causer = getRandomItem(users.filter(u => u.id !== user.id));

                // For video-related notifications, add a videoId
                const isVideoRelated = ['like', 'comment', 'mention'].includes(notificationType.type);
                const videoId = isVideoRelated ?
                    getRandomItem(videos.filter(v => v.userId === user.id))?.id : null;

                if (!isVideoRelated || videoId) {
                    const isRead = getRandomBool(0.6);

                    await prisma.notification.create({
                        data: {
                            type: notificationType.type,
                            message: `${causer.username} ${notificationType.message}`,
                            userId: user.id,
                            causerUserId: causer.id,
                            videoId,
                            isRead,
                            readAt: isRead ? faker.date.recent() : null,
                            createdAt: faker.date.recent({ days: 14 })
                        }
                    });
                }
            }
        }

        // 14. Create device history
        console.log('Creating device history...');
        for (const user of users) {
            // Each user has 1-3 devices
            const deviceCount = getRandomInt(1, 3);

            for (let i = 0; i < deviceCount; i++) {
                const deviceName = getRandomItem(deviceModels);
                const isActive = i === 0 ? true : getRandomBool(0.5); // First device always active
                const loginDate = faker.date.recent({ days: 30 });

                await prisma.deviceHistory.create({
                    data: {
                        userId: user.id,
                        deviceId: faker.string.uuid(),
                        deviceName,
                        deviceModel: deviceName,
                        osVersion: getRandomItem(osVersions),
                        appVersion: getRandomItem(appVersions),
                        ipAddress: faker.internet.ip(),
                        isActive,
                        loginTimestamp: loginDate,
                        logoutTimestamp: isActive ? null : new Date(loginDate.getTime() + getRandomInt(3600000, 86400000)) // 1 hour to 1 day later
                    }
                });
            }
        }

        // 15. Create uploads
        console.log('Creating uploads...');
        for (const user of users) {
            // Profile photo upload
            await prisma.upload.create({
                data: {
                    userId: user.id,
                    fileName: `${faker.string.uuid()}.jpg`,
                    originalFileName: `profile_photo.jpg`,
                    fileType: 'image/jpeg',
                    fileSize: getRandomInt(100000, 2000000), // 100KB - 2MB
                    fileUrl: user.profilePhotoUrl,
                    fileKey: `users/${user.id}/profile/${faker.string.uuid()}.jpg`,
                    fileBucket: 'app-uploads',
                    uploadType: 'PROFILE_PHOTO',
                    status: 'COMPLETED',
                    width: 500,
                    height: 500,
                    createdAt: faker.date.recent({ days: 90 }),
                    updatedAt: faker.date.recent({ days: 90 })
                }
            });

            // Video uploads for this user's videos
            const userVideos = videos.filter(v => v.userId === user.id);
            for (const video of userVideos) {
                // Video upload
                await prisma.upload.create({
                    data: {
                        userId: user.id,
                        fileName: `${faker.string.uuid()}.mp4`,
                        originalFileName: `video_${getRandomInt(1, 100)}.mp4`,
                        fileType: 'video/mp4',
                        fileSize: getRandomInt(1000000, 50000000), // 1MB - 50MB
                        fileUrl: video.videoUrl,
                        fileKey: `users/${user.id}/videos/${faker.string.uuid()}.mp4`,
                        fileBucket: 'app-uploads',
                        uploadType: 'VIDEO',
                        status: 'COMPLETED',
                        width: 1080,
                        height: 1920,
                        duration: video.duration,
                        thumbnailUrl: video.thumbnailUrl,
                        createdAt: video.createdAt,
                        updatedAt: video.createdAt
                    }
                });

                // Thumbnail upload
                await prisma.upload.create({
                    data: {
                        userId: user.id,
                        fileName: `${faker.string.uuid()}.jpg`,
                        originalFileName: `thumbnail_${getRandomInt(1, 100)}.jpg`,
                        fileType: 'image/jpeg',
                        fileSize: getRandomInt(50000, 500000), // 50KB - 500KB
                        fileUrl: video.thumbnailUrl,
                        fileKey: `users/${user.id}/thumbnails/${faker.string.uuid()}.jpg`,
                        fileBucket: 'app-uploads',
                        uploadType: 'THUMBNAIL',
                        status: 'COMPLETED',
                        width: 1080,
                        height: 1920,
                        createdAt: video.createdAt,
                        updatedAt: video.createdAt
                    }
                });
            }

            // Failed upload (occasionally)
            if (getRandomBool(0.1)) {
                await prisma.upload.create({
                    data: {
                        userId: user.id,
                        fileName: `${faker.string.uuid()}.mp4`,
                        originalFileName: `failed_video.mp4`,
                        fileType: 'video/mp4',
                        fileSize: getRandomInt(1000000, 50000000), // 1MB - 50MB
                        fileUrl: '',
                        fileKey: `users/${user.id}/videos/${faker.string.uuid()}.mp4`,
                        fileBucket: 'app-uploads',
                        uploadType: 'VIDEO',
                        status: 'FAILED',
                        processingError: 'File format not supported or file corrupted',
                        createdAt: faker.date.recent({ days: 30 }),
                        updatedAt: faker.date.recent({ days: 30 })
                    }
                });
            }
        }

        // 16. Create video insights
        console.log('Creating video insights...');
        for (const video of videos) {
            // Create daily insights for the past week
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);

                // Get actual counts from our database
                const viewCount = await prisma.viewHistory.count({
                    where: {
                        videoId: video.id,
                        createdAt: {
                            gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
                            lt: date
                        }
                    }
                });

                const uniqueViewerCount = await prisma.viewHistory.groupBy({
                    by: ['userId'],
                    where: {
                        videoId: video.id,
                        createdAt: {
                            gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
                            lt: date
                        }
                    }
                }).then(result => result.length);

                const likeCount = await prisma.like.count({
                    where: {
                        videoId: video.id,
                        createdAt: {
                            gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
                            lt: date
                        }
                    }
                });

                const commentCount = await prisma.comment.count({
                    where: {
                        videoId: video.id,
                        createdAt: {
                            gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
                            lt: date
                        }
                    }
                });

                const shareCount = await prisma.share.count({
                    where: {
                        videoId: video.id,
                        createdAt: {
                            gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
                            lt: date
                        }
                    }
                });

                // Calculate other metrics
                // Get average watch time and completion rate
                const views = await prisma.viewHistory.findMany({
                    where: {
                        videoId: video.id,
                        createdAt: {
                            gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
                            lt: date
                        }
                    },
                    select: {
                        watchTime: true,
                        completionRate: true
                    }
                });

                const averageWatchTime = views.length > 0 ?
                    views.reduce((sum, view) => sum + view.watchTime, 0) / views.length : null;

                const averageCompletionRate = views.length > 0 ?
                    views.reduce((sum, view) => sum + (view.completionRate || 0), 0) / views.length : null;

                // Create age and gender distribution
                const malePercentage = faker.number.float({min: 20, max: 60, precision: 0.1});
                const femalePercentage = faker.number.float({min: 20, max: 60, precision: 0.1});
                const otherPercentage = 100 - malePercentage - femalePercentage;

                const ageRanges = JSON.stringify({
                    "13-17": faker.number.float({min: 5, max: 15, precision: 0.1}),
                    "18-24": faker.number.float({min: 25, max: 45, precision: 0.1}),
                    "25-34": faker.number.float({min: 20, max: 35, precision: 0.1}),
                    "35-44": faker.number.float({min: 10, max: 20, precision: 0.1}),
                    "45+": faker.number.float({min: 5, max: 15, precision: 0.1})
                });

                const topCountries = JSON.stringify({
                    "United States": faker.number.float({min: 20, max: 40, precision: 0.1}),
                    "United Kingdom": faker.number.float({min: 5, max: 15, precision: 0.1}),
                    "Canada": faker.number.float({min: 5, max: 10, precision: 0.1}),
                    "Australia": faker.number.float({min: 3, max: 8, precision: 0.1}),
                    "Germany": faker.number.float({min: 2, max: 7, precision: 0.1}),
                    "Other": faker.number.float({min: 20, max: 50, precision: 0.1})
                });

                // Create the insight record
                try {
                    await prisma.videoInsight.create({
                        data: {
                            videoId: video.id,
                            userId: video.userId,
                            viewCount: viewCount || getRandomInt(0, 100),
                            uniqueViewerCount: uniqueViewerCount || getRandomInt(0, 50),
                            likeCount: likeCount || getRandomInt(0, 30),
                            commentCount: commentCount || getRandomInt(0, 10),
                            shareCount: shareCount || getRandomInt(0, 5),
                            averageWatchTime: averageWatchTime || faker.number.float({
                                min: 5,
                                max: video.duration,
                                precision: 0.1
                            }),
                            averageCompletionRate: averageCompletionRate || faker.number.float({
                                min: 20,
                                max: 95,
                                precision: 0.1
                            }),
                            malePercentage,
                            femalePercentage,
                            otherPercentage,
                            ageRanges,
                            topCountries,
                            retentionRate: faker.number.float({min: 30, max: 90, precision: 0.1}),
                            dropoffPoints: JSON.stringify({
                                "0-25%": faker.number.float({min: 5, max: 20, precision: 0.1}),
                                "25-50%": faker.number.float({min: 10, max: 30, precision: 0.1}),
                                "50-75%": faker.number.float({min: 15, max: 30, precision: 0.1}),
                                "75-100%": faker.number.float({min: 20, max: 70, precision: 0.1})
                            }),
                            date
                        }
                    });
                } catch (error) {
                    // Skip if there's already an insight for this video and date
                    console.log(`Skipping duplicate insight for video ${video.id} on ${date.toISOString().split('T')[0]}`);
                }
            }
        }

        console.log('Seeding completed successfully!');

        // Print some statistics
        const stats = {
            users: await prisma.user.count(),
            videos: await prisma.video.count(),
            comments: await prisma.comment.count(),
            likes: await prisma.like.count(),
            follows: await prisma.follow.count(),
            views: await prisma.viewHistory.count(),
            messages: await prisma.message.count(),
            insights: await prisma.videoInsight.count()
        };

        console.log('Database Statistics:');
        console.table(stats);
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed function
seed()
    .then(() => {
        console.log('Seeding completed!');
    })
    .catch((error) => {
        console.error('Error during seeding:', error);
    });