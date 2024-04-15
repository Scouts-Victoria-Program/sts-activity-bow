/*
  Warnings:

  - A unique constraint covering the columns `[deviceId]` on the table `Tracker` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceId` to the `Tracker` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tracker" ADD COLUMN     "deviceId" TEXT;

-- Copy data
UPDATE "Tracker" 
SET "deviceId" = "name";

-- AlterTable
ALTER TABLE "Tracker" ALTER COLUMN "deviceId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tracker_deviceId_key" ON "Tracker"("deviceId");
