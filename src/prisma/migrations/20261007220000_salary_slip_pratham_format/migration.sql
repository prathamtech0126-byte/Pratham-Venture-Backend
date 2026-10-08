-- AlterTable
ALTER TABLE "SalarySlip" ADD COLUMN     "aadhaar" TEXT,
ADD COLUMN     "clBalance" DOUBLE PRECISION,
ADD COLUMN     "cwBalance" DOUBLE PRECISION,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "pan" TEXT,
ADD COLUMN     "plBalance" DOUBLE PRECISION,
ADD COLUMN     "shift" TEXT,
ADD COLUMN     "slBalance" DOUBLE PRECISION,
ADD COLUMN     "weekOffs" INTEGER;

