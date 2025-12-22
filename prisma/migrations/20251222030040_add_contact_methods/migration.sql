-- CreateEnum
CREATE TYPE "ContactPlatforms" AS ENUM ('INSTAGRAM', 'SMS', 'EMAIL');

-- AlterTable
ALTER TABLE "RidePost" ADD COLUMN     "contactMethod" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "contactPlatform" "ContactPlatforms" NOT NULL DEFAULT 'INSTAGRAM';
