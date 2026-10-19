-- CreateEnum
CREATE TYPE "PassengerStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "ride_passenger" (
    "ridePostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PassengerStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_passenger_pkey" PRIMARY KEY ("ridePostId","userId")
);

-- CreateIndex
CREATE INDEX "ride_passenger_userId_idx" ON "ride_passenger"("userId");

-- AddForeignKey
ALTER TABLE "ride_passenger" ADD CONSTRAINT "ride_passenger_ridePostId_fkey" FOREIGN KEY ("ridePostId") REFERENCES "RidePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_passenger" ADD CONSTRAINT "ride_passenger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

