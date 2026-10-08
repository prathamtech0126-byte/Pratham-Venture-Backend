import { PrismaClient } from "@prisma/client";
import { getContext } from "../utils/requestContext";

/** Models partitioned by workspace — ADMIN and HR users never see each other's rows. */
const WORKSPACE_MODELS = new Set<string>([
  "Company",
  "Designation",
  "Employee",
  "OfferLetter",
  "SalarySlip",
  "NocCertificate",
  "EmploymentVerificationLetter",
  "JobDutyCertificate",
  "AppointmentLetter",
  "PromotionLetter",
  "EngagementLetter",
  "BondRenewal",
]);

const WHERE_OPERATIONS = new Set<string>([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
]);

type AnyArgs = Record<string, any>;

function stripWorkspace(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const { workspace: _ignored, ...rest } = data as AnyArgs;
  return rest;
}

/**
 * Pins every query on a workspace model to the current user's workspace.
 * Enforced here (not in each controller) so a forgotten filter can't leak data.
 * Outside an authenticated request (seed scripts, public routes) queries are unscoped.
 */
const prisma = new PrismaClient().$extends({
  name: "workspace-scope",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const ctx = getContext();
        if (!ctx || !WORKSPACE_MODELS.has(model)) {
          return query(args);
        }

        const { workspace } = ctx;
        const a = { ...(args as AnyArgs) };

        if (WHERE_OPERATIONS.has(operation)) {
          a.where = { ...(a.where ?? {}), workspace };
        }

        switch (operation) {
          case "create":
            a.data = { ...(a.data ?? {}), workspace };
            break;
          case "createMany":
          case "createManyAndReturn":
            a.data = Array.isArray(a.data)
              ? a.data.map((row: AnyArgs) => ({ ...row, workspace }))
              : { ...(a.data ?? {}), workspace };
            break;
          case "upsert":
            a.create = { ...(a.create ?? {}), workspace };
            a.update = stripWorkspace(a.update);
            break;
          case "update":
          case "updateMany":
            // Rows can never be moved to another workspace.
            a.data = stripWorkspace(a.data);
            break;
        }

        return query(a as typeof args);
      },
    },
  },
});

export default prisma;
