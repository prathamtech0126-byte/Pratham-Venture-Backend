CREATE TYPE "PurposeOfVisit_new" AS ENUM (
  'TOURISM',
  'BUSINESS',
  'EDUCATION',
  'MEDICAL',
  'FAMILY',
  'OTHER'
);

ALTER TABLE "NocCertificate"
  ALTER COLUMN "purposeOfVisit" TYPE "PurposeOfVisit_new"
  USING (
    CASE "purposeOfVisit"::text
      WHEN 'STUDY' THEN 'EDUCATION'
      WHEN 'FAMILY_VISIT' THEN 'FAMILY'
      ELSE "purposeOfVisit"::text
    END
  )::"PurposeOfVisit_new";

DROP TYPE "PurposeOfVisit";
ALTER TYPE "PurposeOfVisit_new" RENAME TO "PurposeOfVisit";
