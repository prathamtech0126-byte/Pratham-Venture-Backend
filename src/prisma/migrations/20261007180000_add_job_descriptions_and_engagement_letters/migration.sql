-- AlterTable
ALTER TABLE "AppointmentLetter" ADD COLUMN     "jobDescription" TEXT;

-- AlterTable
ALTER TABLE "Designation" ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "jobSummary" TEXT;

-- AlterTable
ALTER TABLE "OfferLetter" ADD COLUMN     "candidateAddress" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "probationDays" INTEGER,
ADD COLUMN     "reportingTime" TEXT,
ADD COLUMN     "responsibilities" TEXT,
ADD COLUMN     "trainingDays" INTEGER;

-- CreateTable
CREATE TABLE "EngagementLetter" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "letterDate" TIMESTAMP(3),
    "employeeName" TEXT NOT NULL,
    "employeeAddress" TEXT,
    "designation" TEXT NOT NULL,
    "department" TEXT,
    "reportingTo" TEXT,
    "workLocation" TEXT,
    "joiningDate" TIMESTAMP(3),
    "annualCtc" DOUBLE PRECISION,
    "reportingTime" TEXT,
    "trainingDays" INTEGER,
    "probationDays" INTEGER,
    "signatoryName" TEXT,
    "signatoryDesignation" TEXT,
    "contentMode" "DocumentContentMode" NOT NULL DEFAULT 'TEMPLATE',
    "customContent" TEXT,
    "employeeRefId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "workspace" "Workspace" NOT NULL DEFAULT 'HR',

    CONSTRAINT "EngagementLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EngagementLetter_employeeName_idx" ON "EngagementLetter"("employeeName");

-- CreateIndex
CREATE INDEX "EngagementLetter_deletedAt_idx" ON "EngagementLetter"("deletedAt");

-- CreateIndex
CREATE INDEX "EngagementLetter_workspace_deletedAt_idx" ON "EngagementLetter"("workspace", "deletedAt");

-- CreateIndex
CREATE INDEX "EngagementLetter_employeeRefId_idx" ON "EngagementLetter"("employeeRefId");

-- AddForeignKey
ALTER TABLE "EngagementLetter" ADD CONSTRAINT "EngagementLetter_employeeRefId_fkey" FOREIGN KEY ("employeeRefId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

