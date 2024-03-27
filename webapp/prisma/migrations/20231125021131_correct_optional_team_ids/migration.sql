-- DropForeignKey
ALTER TABLE "Flag" DROP CONSTRAINT "Flag_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TrackerLog" DROP CONSTRAINT "TrackerLog_teamId_fkey";

-- AlterTable
ALTER TABLE "Flag" ALTER COLUMN "teamId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TrackerLog" ALTER COLUMN "teamId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TrackerLog" ADD CONSTRAINT "TrackerLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
