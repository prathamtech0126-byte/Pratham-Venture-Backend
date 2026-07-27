import prisma from "../config/db";

/** Ensure employeeRefId points at an active employee, or allow null/undefined. */
export async function assertActiveEmployeeRef(
  employeeRefId: number | null | undefined
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (employeeRefId === undefined || employeeRefId === null) {
    return { ok: true };
  }

  const employee = await prisma.employee.findFirst({
    where: { id: employeeRefId, deletedAt: null },
  });
  if (!employee) {
    return { ok: false, error: "Employee not found (inactive or missing)" };
  }
  return { ok: true };
}
