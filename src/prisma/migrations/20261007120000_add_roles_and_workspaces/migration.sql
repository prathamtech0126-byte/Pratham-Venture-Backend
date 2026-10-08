-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR');

-- CreateEnum
CREATE TYPE "Workspace" AS ENUM ('ADMIN', 'HR');

-- DropIndex
DROP INDEX "Company_name_key";

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "AppointmentLetter" ADD COLUMN     "workspace" "Workspace" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "workspace" "Workspace" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "Designation" ADD COLUMN     "workspace" "Workspace" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "workspace" "Workspace" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "EmploymentVerificationLetter" ADD COLUMN     "workspace" "Workspace" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "JobDutyCertificate" ADD COLUMN     "workspace" "Workspace" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "NocCertificate" ADD COLUMN     "workspace" "Workspace" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "OfferLetter" ADD COLUMN     "workspace" "Workspace" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "PromotionLetter" ADD COLUMN     "workspace" "Workspace" NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "SalarySlip" ADD COLUMN     "workspace" "Workspace" NOT NULL DEFAULT 'ADMIN';

-- CreateIndex
CREATE INDEX "AppointmentLetter_workspace_deletedAt_idx" ON "AppointmentLetter"("workspace", "deletedAt");

-- CreateIndex
CREATE INDEX "Company_workspace_deletedAt_idx" ON "Company"("workspace", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Company_workspace_name_key" ON "Company"("workspace", "name");

-- CreateIndex
CREATE INDEX "Designation_workspace_deletedAt_idx" ON "Designation"("workspace", "deletedAt");

-- CreateIndex
CREATE INDEX "Employee_workspace_deletedAt_idx" ON "Employee"("workspace", "deletedAt");

-- CreateIndex
CREATE INDEX "EmploymentVerificationLetter_workspace_deletedAt_idx" ON "EmploymentVerificationLetter"("workspace", "deletedAt");

-- CreateIndex
CREATE INDEX "JobDutyCertificate_workspace_deletedAt_idx" ON "JobDutyCertificate"("workspace", "deletedAt");

-- CreateIndex
CREATE INDEX "NocCertificate_workspace_deletedAt_idx" ON "NocCertificate"("workspace", "deletedAt");

-- CreateIndex
CREATE INDEX "OfferLetter_workspace_deletedAt_idx" ON "OfferLetter"("workspace", "deletedAt");

-- CreateIndex
CREATE INDEX "PromotionLetter_workspace_deletedAt_idx" ON "PromotionLetter"("workspace", "deletedAt");

-- CreateIndex
CREATE INDEX "SalarySlip_workspace_deletedAt_idx" ON "SalarySlip"("workspace", "deletedAt");

