-- AlterEnum
ALTER TYPE "FirmRole" ADD VALUE 'RESPONSABLE';

-- CreateTable
CREATE TABLE "user_client_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_client_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_client_assignments_userId_clientId_firmId_key" ON "user_client_assignments"("userId", "clientId", "firmId");

-- AddForeignKey
ALTER TABLE "user_client_assignments" ADD CONSTRAINT "user_client_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_client_assignments" ADD CONSTRAINT "user_client_assignments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_client_assignments" ADD CONSTRAINT "user_client_assignments_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
