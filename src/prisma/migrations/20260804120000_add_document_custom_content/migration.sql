-- CreateEnum
CREATE TYPE "DocumentContentMode" AS ENUM ('TEMPLATE', 'CUSTOM');

-- AlterTable
ALTER TABLE "OfferLetter" ADD COLUMN "contentMode" "DocumentContentMode" NOT NULL DEFAULT 'TEMPLATE',
ADD COLUMN "customContent" TEXT;

ALTER TABLE "AppointmentLetter" ADD COLUMN "contentMode" "DocumentContentMode" NOT NULL DEFAULT 'TEMPLATE',
ADD COLUMN "customContent" TEXT;

ALTER TABLE "NocCertificate" ADD COLUMN "contentMode" "DocumentContentMode" NOT NULL DEFAULT 'TEMPLATE',
ADD COLUMN "customContent" TEXT;

ALTER TABLE "EmploymentVerificationLetter" ADD COLUMN "contentMode" "DocumentContentMode" NOT NULL DEFAULT 'TEMPLATE',
ADD COLUMN "customContent" TEXT;

ALTER TABLE "JobDutyCertificate" ADD COLUMN "contentMode" "DocumentContentMode" NOT NULL DEFAULT 'TEMPLATE',
ADD COLUMN "customContent" TEXT;
