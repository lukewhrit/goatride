/*
  Warnings:

  - You are about to drop the column `contactMethod` on the `RidePost` table. All the data in the column will be lost.
  - You are about to drop the column `contactPlatform` on the `RidePost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RidePost" DROP COLUMN "contactMethod",
DROP COLUMN "contactPlatform";

-- DropEnum
DROP TYPE "ContactPlatforms";
