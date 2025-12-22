/*
  Warnings:

  - Made the column `notes` on table `RidePost` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RidePost" ALTER COLUMN "notes" SET NOT NULL,
ALTER COLUMN "notes" SET DEFAULT 'N/A';
