/*
  Warnings:

  - You are about to drop the column `teamId` on the `Action` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Flag` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `TrackerLog` table. All the data in the column will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `baseId` to the `Action` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Flag" DROP CONSTRAINT "Flag_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TrackerLog" DROP CONSTRAINT "TrackerLog_teamId_fkey";

-- AlterTable
ALTER TABLE "Action"
ADD COLUMN     "baseId" INTEGER NOT NULL;
-- Copy data
UPDATE "Action" 
SET "baseId" = "teamId";
-- AlterTable
ALTER TABLE "Action" DROP COLUMN "teamId";

-- AlterTable
ALTER TABLE "Flag"
ADD COLUMN     "baseId" INTEGER;
-- Copy data
UPDATE "Flag" 
SET "baseId" = "teamId";
-- AlterTable
ALTER TABLE "Flag" DROP COLUMN "teamId";

-- AlterTable
ALTER TABLE "TrackerLog"
ADD COLUMN     "baseId" INTEGER;
-- Copy data
UPDATE "TrackerLog" 
SET "baseId" = "teamId";
-- AlterTable
ALTER TABLE "TrackerLog" DROP COLUMN "teamId";

-- CreateTable
CREATE TABLE "Base" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "flagZoneLat" DOUBLE PRECISION,
    "flagZoneLong" DOUBLE PRECISION,

    CONSTRAINT "Base_pkey" PRIMARY KEY ("id")
);

-- Copy Data
INSERT INTO "Base"
SELECT *
FROM "Team";

-- DropTable
DROP TABLE "Team";

-- CreateIndex
CREATE UNIQUE INDEX "Base_name_key" ON "Base"("name");

-- AddForeignKey
ALTER TABLE "TrackerLog" ADD CONSTRAINT "TrackerLog_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
