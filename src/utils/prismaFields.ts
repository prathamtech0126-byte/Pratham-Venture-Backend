/** Prisma relation ids use `undefined` to omit, not `null`. */
export function withPrismaEmployeeRef<T extends { employeeRefId?: number | null }>(
  fields: T
): Omit<T, "employeeRefId"> & { employeeRefId?: number } {
  const { employeeRefId, ...rest } = fields;
  if (employeeRefId === undefined) {
    return rest as Omit<T, "employeeRefId"> & { employeeRefId?: number };
  }
  return {
    ...rest,
    employeeRefId: employeeRefId ?? undefined,
  };
}
