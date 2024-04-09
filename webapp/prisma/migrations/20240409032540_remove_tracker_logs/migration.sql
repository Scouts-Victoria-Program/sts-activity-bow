/*
  Warnings:

  - You are about to drop the `TrackerLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrackerLog" DROP CONSTRAINT "TrackerLog_baseId_fkey";

-- DropForeignKey
ALTER TABLE "TrackerLog" DROP CONSTRAINT "TrackerLog_trackerId_fkey";

-- DropTable
DROP TABLE "TrackerLog";
