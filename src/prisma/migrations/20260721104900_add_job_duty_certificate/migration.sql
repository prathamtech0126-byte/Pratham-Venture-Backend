-- CreateTable
CREATE TABLE "JobDutyCertificate" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "registrationNo" TEXT,
    "designation" TEXT,
    "employmentStartDate" TIMESTAMP(3),
    "employmentEndDate" TIMESTAMP(3),
    "workResponsibilities" TEXT,
    "monthlyGrossSalary" DOUBLE PRECISION,
    "performanceRemarks" TEXT,
    "certificateDate" TIMESTAMP(3),
    "authorizedSignatory" TEXT,
    "employeeRefId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "JobDutyCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobDutyCertificate_employeeName_idx" ON "JobDutyCertificate"("employeeName");

-- CreateIndex
CREATE INDEX "JobDutyCertificate_registrationNo_idx" ON "JobDutyCertificate"("registrationNo");

-- CreateIndex
CREATE INDEX "JobDutyCertificate_deletedAt_idx" ON "JobDutyCertificate"("deletedAt");

-- CreateIndex
CREATE INDEX "JobDutyCertificate_employeeRefId_idx" ON "JobDutyCertificate"("employeeRefId");

-- AddForeignKey
ALTER TABLE "JobDutyCertificate" ADD CONSTRAINT "JobDutyCertificate_employeeRefId_fkey" FOREIGN KEY ("employeeRefId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
