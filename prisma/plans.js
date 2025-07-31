/**
 * Sample script to create default subscription plans in the database
 *
 * This can be run as a one-time migration or seed script
 */


import { prisma } from '@/lib/prisma';

async function createDefaultSubscriptionPlans() {
    try {
        console.log('Creating default subscription plans...');

        // First check if any template plans already exist
        const existingPlans = await prisma.subscriptionPlan.findMany({
            where: {
                isTemplate: true,
            },
        });

        if (existingPlans.length > 0) {
            console.log(`${existingPlans.length} template plans already exist. Skipping creation.`);
            return;
        }

        // Template plans - these are platform-defined plans that creators can use
        const templatePlans = [
            {
                name: 'Basic',
                description: 'Support your favorite creators with basic access to exclusive content',
                price: 4.99,
                currency: 'USD',
                intervalType: 'monthly',
                features: JSON.stringify([
                    'Access to subscriber-only content',
                    'Creator community access',
                    'Early access to new videos'
                ]),
                isTemplate: true,
                creatorId: null
            },
            {
                name: 'Premium',
                description: 'Get premium access with more exclusive perks and content',
                price: 9.99,
                currency: 'USD',
                intervalType: 'monthly',
                features: JSON.stringify([
                    'All Basic tier benefits',
                    'Exclusive behind-the-scenes content',
                    'Monthly Q&A sessions',
                    'Subscriber badge on comments'
                ]),
                isTemplate: true,
                creatorId: null
            },
            {
                name: 'VIP',
                description: 'Ultimate fan experience with all premium features and VIP treatment',
                price: 19.99,
                currency: 'USD',
                intervalType: 'monthly',
                features: JSON.stringify([
                    'All Premium tier benefits',
                    'Personal shoutouts in videos',
                    'Exclusive merchandise discounts',
                    'Private Discord access',
                    'Monthly video calls with creator'
                ]),
                isTemplate: true,
                creatorId: null
            },
            {
                name: 'Annual Basic',
                description: 'Save with an annual subscription to basic features',
                price: 49.99,
                currency: 'USD',
                intervalType: 'yearly',
                features: JSON.stringify([
                    'All Basic tier benefits',
                    '15% savings compared to monthly',
                    'Annual subscriber badge'
                ]),
                isTemplate: true,
                creatorId: null
            },
            {
                name: 'Annual Premium',
                description: 'Save with an annual subscription to premium features',
                price: 99.99,
                currency: 'USD',
                intervalType: 'yearly',
                features: JSON.stringify([
                    'All Premium tier benefits',
                    '15% savings compared to monthly',
                    'Annual subscriber badge',
                    'Exclusive year-end bonus content'
                ]),
                isTemplate: true,
                creatorId: null
            }
        ];

        // Create all template plans
        const result = await prisma.subscriptionPlan.createMany({
            data: templatePlans,
        });

        console.log(`Created ${result.count} default subscription plan templates.`);

        // Sample creator-specific plan for testing
        if (process.env.SAMPLE_CREATOR_ID) {
            const creatorId = process.env.SAMPLE_CREATOR_ID;

            // Check if creator exists and is eligible
            const creator = await prisma.user.findUnique({
                where: {
                    id: creatorId,
                    isEligibleForCreator: true,
                },
                select: {
                    id: true,
                    username: true,
                },
            });

            if (creator) {
                // Create custom plans for this creator
                const customPlan = await prisma.subscriptionPlan.create({
                    data: {
                        name: `${creator.username}'s Special Tier`,
                        description: `Custom subscription plan for fans of ${creator.username}`,
                        price: 7.99,
                        currency: 'USD',
                        intervalType: 'monthly',
                        features: JSON.stringify([
                            'Exclusive access to my private content',
                            'Weekly livestream access',
                            'Custom emojis in chat',
                            'Priority comment responses'
                        ]),
                        isTemplate: false,
                        creatorId: creatorId
                    },
                });

                console.log(`Created custom plan for creator ${creator.username}: ${customPlan.name}`);
            } else {
                console.log(`Creator with ID ${creatorId} not found or not eligible. Skipping custom plan creation.`);
            }
        }

    } catch (error) {
        console.error('Error creating default subscription plans:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Execute the function
createDefaultSubscriptionPlans()
    .then(() => console.log('Subscription plan setup complete'))
    .catch((e) => console.error('Error in subscription plan setup:', e));