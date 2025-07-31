-- AlterTable
ALTER TABLE `SubscriptionPlan` ADD COLUMN `creatorId` VARCHAR(191) NULL,
    ADD COLUMN `isTemplate` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `SubscriptionPlan_creatorId_idx` ON `SubscriptionPlan`(`creatorId`);

-- AddForeignKey
ALTER TABLE `SubscriptionPlan` ADD CONSTRAINT `SubscriptionPlan_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
