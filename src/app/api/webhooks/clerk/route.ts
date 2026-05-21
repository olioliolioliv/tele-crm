import type { WebhookEvent } from '@clerk/nextjs/server';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { memberSchema, organizationSchema } from '@/models/Schema';

/**
 * Clerk webhook receiver. Keeps our `organization` and `member` tables in sync
 * with Clerk's hosted org + user state. Verified via svix signature.
 *
 * Subscribed events (configure in Clerk dashboard):
 *   - organization.created, organization.updated
 *   - organizationMembership.created, organizationMembership.updated
 *   - user.updated
 */
export async function POST(req: NextRequest) {
  const secret = Env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }

  const headerPayload = headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'missing svix headers' },
      { status: 400 },
    );
  }

  const rawBody = await req.text();
  const wh = new Webhook(secret);
  let evt: WebhookEvent;
  try {
    evt = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    logger.warn({ err }, 'Clerk webhook signature verification failed');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  switch (evt.type) {
    case 'organization.created':
    case 'organization.updated': {
      const org = evt.data;
      await db
        .insert(organizationSchema)
        .values({
          id: org.id,
          name: org.name,
          timezone: 'UTC',
        })
        .onConflictDoUpdate({
          target: organizationSchema.id,
          set: { name: org.name },
        });
      break;
    }

    case 'organizationMembership.created':
    case 'organizationMembership.updated': {
      const m = evt.data;
      const user = m.public_user_data;
      const role = m.role === 'org:admin' ? 'OWNER' : 'CHATTER';
      const displayName
        = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
        || null;

      // Defensive upsert of the org first — the organization.created webhook
      // can race with this one. Clerk includes org details in the membership
      // payload, so we have everything we need.
      await db
        .insert(organizationSchema)
        .values({
          id: m.organization.id,
          name: m.organization.name,
          timezone: 'UTC',
        })
        .onConflictDoNothing();

      await db
        .insert(memberSchema)
        .values({
          id: createId(),
          clerkUserId: user.user_id,
          organizationId: m.organization.id,
          role,
          email: user.identifier ?? '',
          displayName,
        })
        .onConflictDoUpdate({
          target: [memberSchema.clerkUserId, memberSchema.organizationId],
          set: { role, email: user.identifier ?? '' },
        });
      break;
    }

    case 'user.updated': {
      const user = evt.data;
      const fullName
        = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
        || null;
      const email = user.email_addresses[0]?.email_address ?? '';
      await db
        .update(memberSchema)
        .set({ displayName: fullName, email })
        .where(eq(memberSchema.clerkUserId, user.id));
      break;
    }

    default:
      logger.info({ type: evt.type }, 'Clerk webhook: unhandled event type');
  }

  return NextResponse.json({ ok: true });
}
