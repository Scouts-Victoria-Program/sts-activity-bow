/*
  Warnings:

  - You are about to drop the column `ttl` on the `BowAlert` table. All the data in the column will be lost.
  - Added the required column `expiry` to the `BowAlert` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BowAlert" DROP COLUMN "ttl",
ADD COLUMN     "expiry" TIMESTAMP(3) NOT NULL;
