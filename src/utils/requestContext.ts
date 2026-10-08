import { AsyncLocalStorage } from "async_hooks";
import { Role, Workspace } from "@prisma/client";

export interface RequestContext {
  userId: number;
  role: Role;
  /** Workspace every scoped query is pinned to. */
  workspace: Workspace;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Run `fn` (and everything async it triggers) inside the given user context. */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/** Current user context, or undefined outside an authenticated request (seed, public routes). */
export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

/**
 * Resolve the workspace for a request. ADMIN and HR are fixed to their own workspace;
 * SUPER_ADMIN picks one via the X-Workspace header (defaults to ADMIN).
 * Returns null when a super admin sends an unknown workspace.
 */
export function resolveWorkspace(role: Role, requested: string | undefined): Workspace | null {
  if (role === Role.HR) return Workspace.HR;
  if (role === Role.ADMIN) return Workspace.ADMIN;

  if (!requested) return Workspace.ADMIN;
  const upper = requested.trim().toUpperCase();
  return (Object.values(Workspace) as string[]).includes(upper) ? (upper as Workspace) : null;
}

/** Contact-form submissions belong to the Pratham Venture sites — never visible to HR. */
export function canViewSubmissions(role: Role | undefined): boolean {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}
