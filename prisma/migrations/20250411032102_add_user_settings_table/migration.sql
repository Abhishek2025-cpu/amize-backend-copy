/*
  Warnings:

  - You are about to drop the column `creatorSubscriptionPrice` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `facebookHandle` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `instagramHandle` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isBusinessAccount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `maxSubscriptionAmount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `minSubscriptionAmount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `notificationSettings` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twitterHandle` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `useFaceId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `useFingerprint` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `creatorSubscriptionPrice`,
    DROP COLUMN `facebookHandle`,
    DROP COLUMN `instagramHandle`,
    DROP COLUMN `isBusinessAccount`,
    DROP COLUMN `isPrivate`,
    DROP COLUMN `language`,
    DROP COLUMN `maxSubscriptionAmount`,
    DROP COLUMN `minSubscriptionAmount`,
    DROP COLUMN `notificationSettings`,
    DROP COLUMN `twitterHandle`,
    DROP COLUMN `useFaceId`,
    DROP COLUMN `useFingerprint`;

-- CreateTable
CREATE TABLE `UserSettings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `darkMode` BOOLEAN NOT NULL DEFAULT false,
    `rememberMe` BOOLEAN NOT NULL DEFAULT false,
    `language` VARCHAR(191) NOT NULL DEFAULT 'English',
    `useFingerprint` BOOLEAN NOT NULL DEFAULT false,
    `useFaceId` BOOLEAN NOT NULL DEFAULT false,
    `pin` VARCHAR(191) NULL,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `isBusinessAccount` BOOLEAN NOT NULL DEFAULT false,
    `instagramHandle` VARCHAR(191) NULL,
    `facebookHandle` VARCHAR(191) NULL,
    `twitterHandle` VARCHAR(191) NULL,
    `notificationSettings` TEXT NULL,
    `creatorSubscriptionPrice` DOUBLE NULL,
    `minSubscriptionAmount` DOUBLE NULL,
    `maxSubscriptionAmount` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserSettings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserSettings` ADD CONSTRAINT `UserSettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
