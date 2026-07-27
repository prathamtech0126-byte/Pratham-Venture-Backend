-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employeeCode" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "workLocation" TEXT,
    "joiningDate" TIMESTAMP(3),
    "annualCtc" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Employee_company_idx" ON "Employee"("company");

-- CreateIndex
CREATE INDEX "Employee_name_idx" ON "Employee"("name");

-- CreateIndex
CREATE INDEX "Employee_employeeCode_idx" ON "Employee"("employeeCode");

-- CreateIndex
CREATE INDEX "Employee_deletedAt_idx" ON "Employee"("deletedAt");

-- CreateIndex
CREATE INDEX "Employee_company_deletedAt_idx" ON "Employee"("company", "deletedAt");
