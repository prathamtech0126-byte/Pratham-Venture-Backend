-- CreateTable
CREATE TABLE "PromotionLetter" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "recipientAddress" TEXT,
    "letterDate" TIMESTAMP(3),
    "previousDesignation" TEXT,
    "newDesignation" TEXT NOT NULL,
    "department" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "monthlySalary" DOUBLE PRECISION,
    "previousRoleStartDate" TIMESTAMP(3),
    "performanceHighlights" TEXT,
    "newResponsibilities" TEXT,
    "additionalNotes" TEXT,
    "signatoryName" TEXT,
    "signatoryDesignation" TEXT,
    "contentMode" "DocumentContentMode" NOT NULL DEFAULT 'TEMPLATE',
    "customContent" TEXT,
    "employeeRefId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PromotionLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromotionLetter_employeeName_idx" ON "PromotionLetter"("employeeName");

-- CreateIndex
CREATE INDEX "PromotionLetter_newDesignation_idx" ON "PromotionLetter"("newDesignation");

-- CreateIndex
CREATE INDEX "PromotionLetter_deletedAt_idx" ON "PromotionLetter"("deletedAt");

-- CreateIndex
CREATE INDEX "PromotionLetter_employeeRefId_idx" ON "PromotionLetter"("employeeRefId");

-- AddForeignKey
ALTER TABLE "PromotionLetter" ADD CONSTRAINT "PromotionLetter_employeeRefId_fkey" FOREIGN KEY ("employeeRefId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
