warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- AlterEnum
BEGIN;
CREATE TYPE "public"."EmployeeStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED');
ALTER TABLE "employees" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."employees" ALTER COLUMN "status" TYPE "public"."EmployeeStatus_new" USING ("status"::text::"public"."EmployeeStatus_new");
ALTER TYPE "public"."EmployeeStatus" RENAME TO "EmployeeStatus_old";
ALTER TYPE "public"."EmployeeStatus_new" RENAME TO "EmployeeStatus";
DROP TYPE "EmployeeStatus_old";
ALTER TABLE "public"."employees" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ContractType_new" AS ENUM ('CDI', 'CDD', 'STAGE', 'PRESTATION');
ALTER TABLE "public"."contracts" ALTER COLUMN "type" TYPE "public"."ContractType_new" USING ("type"::text::"public"."ContractType_new");
ALTER TYPE "public"."ContractType" RENAME TO "ContractType_old";
ALTER TYPE "public"."ContractType_new" RENAME TO "ContractType";
DROP TYPE "ContractType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."MissionStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "missions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."missions" ALTER COLUMN "status" TYPE "public"."MissionStatus_new" USING ("status"::text::"public"."MissionStatus_new");
ALTER TYPE "public"."MissionStatus" RENAME TO "MissionStatus_old";
ALTER TYPE "public"."MissionStatus_new" RENAME TO "MissionStatus";
DROP TYPE "MissionStatus_old";
ALTER TABLE "public"."missions" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."FileEntity_new" AS ENUM ('EMPLOYEE', 'CLIENT', 'CONTRACT', 'MISSION');
ALTER TABLE "public"."file_objects" ALTER COLUMN "entity" TYPE "public"."FileEntity_new" USING ("entity"::text::"public"."FileEntity_new");
ALTER TYPE "public"."FileEntity" RENAME TO "FileEntity_old";
ALTER TYPE "public"."FileEntity_new" RENAME TO "FileEntity";
DROP TYPE "FileEntity_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_managerId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_assignedClientId_fkey";

-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_clientId_fkey";

-- DropForeignKey
ALTER TABLE "employee_transfers" DROP CONSTRAINT "employee_transfers_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "employee_transfers" DROP CONSTRAINT "employee_transfers_fromFirmId_fkey";

-- DropForeignKey
ALTER TABLE "employee_transfers" DROP CONSTRAINT "employee_transfers_toFirmId_fkey";

-- DropForeignKey
ALTER TABLE "employee_transfers" DROP CONSTRAINT "employee_transfers_clientId_fkey";

-- DropForeignKey
ALTER TABLE "employee_transfers" DROP CONSTRAINT "employee_transfers_requestedBy_fkey";

-- DropForeignKey
ALTER TABLE "employee_transfers" DROP CONSTRAINT "employee_transfers_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_reviewedBy_fkey";

-- DropForeignKey
ALTER TABLE "leave_balances" DROP CONSTRAINT "leave_balances_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "absences" DROP CONSTRAINT "absences_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "absences" DROP CONSTRAINT "absences_recordedBy_fkey";

-- DropForeignKey
ALTER TABLE "missions" DROP CONSTRAINT "missions_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "mission_expenses" DROP CONSTRAINT "mission_expenses_missionId_fkey";

-- DropForeignKey
ALTER TABLE "payroll_configs" DROP CONSTRAINT "payroll_configs_firmId_fkey";

-- DropForeignKey
ALTER TABLE "employee_salaries" DROP CONSTRAINT "employee_salaries_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_firmId_fkey";

-- DropForeignKey
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_salaryId_fkey";

-- DropForeignKey
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "client_firm_assignments" DROP CONSTRAINT "client_firm_assignments_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_firm_assignments" DROP CONSTRAINT "client_firm_assignments_firmId_fkey";

-- DropForeignKey
ALTER TABLE "client_quarterly_reports" DROP CONSTRAINT "client_quarterly_reports_firmId_fkey";

-- DropForeignKey
ALTER TABLE "client_quarterly_reports" DROP CONSTRAINT "client_quarterly_reports_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_quarterly_reports" DROP CONSTRAINT "client_quarterly_reports_generatedBy_fkey";

-- AlterTable
ALTER TABLE "public"."departments" DROP COLUMN "managerId";

-- AlterTable
ALTER TABLE "public"."employees" DROP COLUMN "address",
DROP COLUMN "assignedClientId",
DROP COLUMN "assignmentStartDate",
DROP COLUMN "email",
DROP COLUMN "emergencyContact",
DROP COLUMN "firstInterimDate",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "public"."contracts" DROP COLUMN "alertThreshold",
DROP COLUMN "clientId",
DROP COLUMN "isActive",
DROP COLUMN "isAutoRenewal",
DROP COLUMN "notes",
DROP COLUMN "position",
DROP COLUMN "renewalDate",
DROP COLUMN "salary",
DROP COLUMN "terminationDate",
DROP COLUMN "terminationReason",
DROP COLUMN "trialPeriodEnd",
DROP COLUMN "workingHours";

-- AlterTable
ALTER TABLE "public"."leave_requests" DROP COLUMN "isJustified",
DROP COLUMN "isPaid",
DROP COLUMN "justification",
DROP COLUMN "leaveType",
DROP COLUMN "rejectionReason",
DROP COLUMN "requestedAt",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedBy",
DROP COLUMN "supportingDoc",
DROP COLUMN "totalDays";

-- AlterTable
ALTER TABLE "public"."missions" DROP COLUMN "actualAmount",
DROP COLUMN "approvedAt",
DROP COLUMN "approvedBy",
DROP COLUMN "budgetAmount",
DROP COLUMN "completedAt",
DROP COLUMN "missionFees",
DROP COLUMN "rejectionReason",
DROP COLUMN "report";

-- AlterTable
ALTER TABLE "public"."clients" DROP COLUMN "contactEmail",
DROP COLUMN "contactPhone",
DROP COLUMN "contractEndDate",
DROP COLUMN "contractStartDate",
DROP COLUMN "industry",
DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "public"."file_objects" DROP COLUMN "description",
DROP COLUMN "documentType",
DROP COLUMN "expiryDate",
DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "mimeType";

-- DropTable
DROP TABLE "employee_transfers";

-- DropTable
DROP TABLE "leave_balances";

-- DropTable
DROP TABLE "absences";

-- DropTable
DROP TABLE "mission_expenses";

-- DropTable
DROP TABLE "payroll_configs";

-- DropTable
DROP TABLE "employee_salaries";

-- DropTable
DROP TABLE "payslips";

-- DropTable
DROP TABLE "client_firm_assignments";

-- DropTable
DROP TABLE "client_quarterly_reports";

-- DropEnum
DROP TYPE "TransferStatus";

-- DropEnum
DROP TYPE "LeaveType";

-- DropEnum
DROP TYPE "AbsenceType";

-- DropEnum
DROP TYPE "ExpenseCategory";

-- DropEnum
DROP TYPE "PayslipStatus";

-- DropEnum
DROP TYPE "DocumentType";

