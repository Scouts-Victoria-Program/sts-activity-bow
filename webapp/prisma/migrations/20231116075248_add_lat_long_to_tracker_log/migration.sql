/*
  Warnings:

  - Added the required column `distance` to the `TrackerLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lat` to the `TrackerLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `long` to the `TrackerLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TrackerLog" ADD COLUMN     "distance" INTEGER NOT NULL,
ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "long" DOUBLE PRECISION NOT NULL;
