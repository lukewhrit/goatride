-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('OPEN', 'FULL', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "RidePost" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLng" DOUBLE PRECISION NOT NULL,
    "destinationLat" DOUBLE PRECISION NOT NULL,
    "destinationLng" DOUBLE PRECISION NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "seatsAvailable" INTEGER NOT NULL,
    "seatsTaken" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "price" DECIMAL(6,2),
    "status" "RideStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEditedAt" TIMESTAMP(3),

    CONSTRAINT "RidePost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RidePost_creatorId_idx" ON "RidePost"("creatorId");

-- CreateIndex
CREATE INDEX "RidePost_departureTime_idx" ON "RidePost"("departureTime");

-- CreateIndex
CREATE INDEX "RidePost_destinationLat_idx" ON "RidePost"("destinationLat");

-- CreateIndex
CREATE INDEX "RidePost_destinationLng_idx" ON "RidePost"("destinationLng");

-- CreateIndex
CREATE INDEX "RidePost_status_idx" ON "RidePost"("status");

-- CreateIndex
CREATE INDEX "RidePost_createdAt_idx" ON "RidePost"("createdAt");

-- AddForeignKey
ALTER TABLE "RidePost" ADD CONSTRAINT "RidePost_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
