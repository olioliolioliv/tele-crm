import { auth } from '@clerk/nextjs/server';

/**
 * Resolve the current tenant (Clerk organization) from the request context.
 * Throws if no orgId is in the session — call this only from routes that
 * require an active organization context.
 *
 * Returns Clerk's `orgId` mapped as our `tenantId`, plus the Clerk `userId`.
 */
export async function requireTenant(): Promise<{
  tenantId: string;
  userId: string;
}> {
  const a = await auth();
  if (!a.userId) {
    throw new Error('Not authenticated');
  }
  if (!a.orgId) {
    throw new Error('No active organization');
  }
  return { tenantId: a.orgId, userId: a.userId };
}

/**
 * For background workers or jobs that already know which tenant they're acting
 * on. Use when you have a tenantId from a webhook payload, not from a user
 * session.
 */
export function tenantContext(tenantId: string): { tenantId: string } {
  if (!tenantId) {
    throw new Error('tenantId is required');
  }
  return { tenantId };
}
