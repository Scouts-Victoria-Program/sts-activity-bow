/*
  Warnings:

  - You are about to drop the column `flagZoneLat` on the `Base` table. All the data in the column will be lost.
  - You are about to drop the column `flagZoneLong` on the `Base` table. All the data in the column will be lost.
  - You are about to drop the `Flag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Flag" DROP CONSTRAINT "Flag_baseId_fkey";

-- DropForeignKey
ALTER TABLE "Flag" DROP CONSTRAINT "Flag_trackerId_fkey";

-- AlterTable
ALTER TABLE "Base"
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "long" DOUBLE PRECISION;
-- Copy data
UPDATE "Base" 
SET "lat" = "flagZoneLat",
    "long" = "flagZoneLong";
-- AlterTable
ALTER TABLE "Base"
DROP COLUMN "flagZoneLat",
DROP COLUMN "flagZoneLong";

-- CreateTable
CREATE TABLE "TrackerLocation" (
    "id" SERIAL NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "windowSize" INTEGER NOT NULL,
    "scoreModifier" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "trackerId" INTEGER NOT NULL,
    "baseId" INTEGER,
    "distance" INTEGER NOT NULL,

    CONSTRAINT "TrackerLocation_pkey" PRIMARY KEY ("id")
);

-- Copy Data
INSERT INTO "TrackerLocation"
SELECT *
FROM "Flag";

-- DropTable
DROP TABLE "Flag";

-- AddForeignKey
ALTER TABLE "TrackerLocation" ADD CONSTRAINT "TrackerLocation_trackerId_fkey" FOREIGN KEY ("trackerId") REFERENCES "Tracker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackerLocation" ADD CONSTRAINT "TrackerLocation_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE SET NULL ON UPDATE CASCADE;
