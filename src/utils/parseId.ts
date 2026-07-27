/** Parse a route param into a positive integer id, or null if invalid. */
export function parseId(raw: string): number | null {
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
}
