-- CreateTable
CREATE TABLE "BowAlert" (
    "id" SERIAL NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "faction" TEXT NOT NULL,
    "ttl" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "baseId" INTEGER NOT NULL,

    CONSTRAINT "BowAlert_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BowAlert" ADD CONSTRAINT "BowAlert_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
