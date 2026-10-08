-- CreateTable
CREATE TABLE "BondRenewal" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "letterDate" TIMESTAMP(3),
    "employeeName" TEXT NOT NULL,
    "employeeAddress" TEXT,
    "designation" TEXT NOT NULL,
    "department" TEXT,
    "workLocation" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "compensation" TEXT,
    "bondDuration" TEXT,
    "reportingTo" TEXT,
    "scheduleA" TEXT,
    "scheduleB" TEXT,
    "includeSignature" BOOLEAN NOT NULL DEFAULT true,
    "employeeRefId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "workspace" "Workspace" NOT NULL DEFAULT 'HR',

    CONSTRAINT "BondRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BondRenewal_employeeName_idx" ON "BondRenewal"("employeeName");

-- CreateIndex
CREATE INDEX "BondRenewal_deletedAt_idx" ON "BondRenewal"("deletedAt");

-- CreateIndex
CREATE INDEX "BondRenewal_workspace_deletedAt_idx" ON "BondRenewal"("workspace", "deletedAt");

-- CreateIndex
CREATE INDEX "BondRenewal_employeeRefId_idx" ON "BondRenewal"("employeeRefId");

-- AddForeignKey
ALTER TABLE "BondRenewal" ADD CONSTRAINT "BondRenewal_employeeRefId_fkey" FOREIGN KEY ("employeeRefId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

