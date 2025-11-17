-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED');

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "clientFirmId" TEXT,
ADD COLUMN     "renewedFromId" TEXT,
ADD COLUMN     "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE';

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_renewedFromId_fkey" FOREIGN KEY ("renewedFromId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_clientFirmId_fkey" FOREIGN KEY ("clientFirmId") REFERENCES "firms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
