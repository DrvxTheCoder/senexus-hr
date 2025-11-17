-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "assignmentStartDate",
DROP COLUMN "firstInterimDate",
ADD COLUMN "category" TEXT,
ADD COLUMN "cni" TEXT,
ADD COLUMN "contractEndDate" TIMESTAMP(3),
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "fatherName" TEXT,
ADD COLUMN "gender" "Gender",
ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "maritalStatus" TEXT,
ADD COLUMN "motherName" TEXT,
ADD COLUMN "nationality" TEXT,
ADD COLUMN "netSalary" DECIMAL(10,2),
ADD COLUMN "photoUrl" TEXT,
ADD COLUMN "placeOfBirth" TEXT;

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "description" TEXT,
    "expiryDate" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
