-- AlterTable
ALTER TABLE "employee_documents" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
