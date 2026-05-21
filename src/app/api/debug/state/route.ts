/**
 * Dev-only debug endpoint — returns row counts and recent rows from key tables.
 * Used by the week-1 smoke test to verify webhook sync.
 *
 * Guarded by NODE_ENV check so it's a no-op in production.
 */
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { memberSchema, organizationSchema } from '@/models/Schema';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not available in production' }, { status: 404 });
  }

  const orgs = await db.select().from(organizationSchema);
  const members = await db.select().from(memberSchema);

  return NextResponse.json({
    counts: {
      organizations: orgs.length,
      members: members.length,
    },
    organizations: orgs,
    members,
  });
}
