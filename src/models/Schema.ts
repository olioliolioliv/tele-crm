import { sql } from 'drizzle-orm';
import {
  bigint,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Tele-CRM Phase 1 domain schema.
//
// Multi-tenancy: every domain row is scoped by `organization_id` (== Clerk org
// id). Row-level isolation is enforced in the application layer via the
// `withTenant` query wrapper (see src/libs/Tenant.ts) — bypassing the wrapper
// is a code-review gate.
//
// To regenerate the migration after schema changes:
//   npm run db:generate

// ----- Tenants -----

export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(), // == Clerk org id
    name: text('name').notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    billingRef: text('billing_ref'), // nullable until billing ships (week 7)
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
);

// ----- Members (per-org user join) -----

export const roleEnum = pgEnum('role', ['OWNER', 'MANAGER', 'CHATTER']);

export const memberSchema = pgTable(
  'member',
  {
    // Synthetic row id. The natural key is (clerk_user_id, organization_id):
    // a single Clerk user can belong to multiple orgs, so we cannot use
    // the Clerk user id as the primary key.
    id: text('id').primaryKey(),
    clerkUserId: text('clerk_user_id').notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull().default('CHATTER'),
    displayName: text('display_name'),
    email: text('email').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => ({
    orgIdIdx: index('member_org_id_idx').on(table.organizationId),
    userOrgUnique: uniqueIndex('member_user_org_unique_idx').on(
      table.clerkUserId,
      table.organizationId,
    ),
  }),
);

// ----- Creators (talents managed by an agency) -----

export const creatorSchema = pgTable(
  'creator',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    displayName: text('display_name').notNull(),
    telegramHandle: text('telegram_handle'),
    tgmBotAccountId: text('tgm_bot_account_id'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    orgIdIdx: index('creator_org_id_idx').on(table.organizationId),
  }),
);

// ----- Fans (subscribers / DMing users on Telegram) -----

export const fanSchema = pgTable(
  'fan',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    telegramUserId: text('telegram_user_id').notNull(),
    displayName: text('display_name'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    orgTelegramUserIdx: uniqueIndex('fan_org_telegram_user_idx').on(
      table.organizationId,
      table.telegramUserId,
    ),
  }),
);

// ----- Threads (creator <-> fan conversations) -----

export const threadStatusEnum = pgEnum('thread_status', [
  'OPEN',
  'CLOSED',
  'SNOOZED',
]);

export const threadSchema = pgTable(
  'thread',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    creatorId: text('creator_id')
      .notNull()
      .references(() => creatorSchema.id, { onDelete: 'cascade' }),
    fanId: text('fan_id')
      .notNull()
      .references(() => fanSchema.id, { onDelete: 'cascade' }),
    status: threadStatusEnum('status').notNull().default('OPEN'),
    assignedMemberId: text('assigned_member_id').references(
      () => memberSchema.id,
      { onDelete: 'set null' },
    ),
    lastMessageAt: timestamp('last_message_at', { mode: 'date' }),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    creatorFanIdx: uniqueIndex('thread_creator_fan_idx').on(
      table.creatorId,
      table.fanId,
    ),
    orgLastMessageIdx: index('thread_org_last_message_idx').on(
      table.organizationId,
      table.lastMessageAt,
    ),
  }),
);

// ----- Messages -----

export const directionEnum = pgEnum('direction', ['INBOUND', 'OUTBOUND']);

export const messageSchema = pgTable(
  'message',
  {
    id: text('id').primaryKey(),
    threadId: text('thread_id')
      .notNull()
      .references(() => threadSchema.id, { onDelete: 'cascade' }),
    direction: directionEnum('direction').notNull(),
    content: text('content').notNull(),
    attachments: text('attachments'), // JSON-encoded; Phase 2 swaps to jsonb
    sentByMemberId: text('sent_by_member_id').references(
      () => memberSchema.id,
      { onDelete: 'set null' },
    ),
    externalId: text('external_id'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    threadIdx: index('message_thread_idx').on(table.threadId, table.createdAt),
    externalIdUnique: uniqueIndex('message_external_id_unique')
      .on(table.externalId)
      .where(sql`${table.externalId} IS NOT NULL`),
  }),
);

// ----- Activity log (write-side; UI in §5.9) -----

export const activityEventSchema = pgTable(
  'activity_event',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    memberId: text('member_id').references(() => memberSchema.id, {
      onDelete: 'set null',
    }),
    type: text('type').notNull(), // 'message.sent', 'thread.assigned', 'script.used', ...
    payload: text('payload'), // JSON-encoded
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    orgCreatedIdx: index('activity_org_created_idx').on(
      table.organizationId,
      table.createdAt,
    ),
  }),
);

// ----- Scripts (templates with media + variable expansion) -----

export const scriptSchema = pgTable(
  'script',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    content: text('content').notNull(),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    internalNote: text('internal_note'),
    mediaIds: text('media_ids').array().notNull().default(sql`'{}'::text[]`),
    createdBy: text('created_by').references(() => memberSchema.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    orgNameIdx: index('script_org_name_idx').on(
      table.organizationId,
      table.name,
    ),
  }),
);

export const scriptUsageSchema = pgTable(
  'script_usage',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    scriptId: text('script_id')
      .notNull()
      .references(() => scriptSchema.id, { onDelete: 'cascade' }),
    threadId: text('thread_id')
      .notNull()
      .references(() => threadSchema.id, { onDelete: 'cascade' }),
    sentByMemberId: text('sent_by_member_id').references(
      () => memberSchema.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    scriptIdx: index('script_usage_script_idx').on(
      table.organizationId,
      table.scriptId,
      table.createdAt,
    ),
    threadIdx: index('script_usage_thread_idx').on(table.threadId),
  }),
);

// ----- Vault (per-creator media library) -----

export const vaultKindEnum = pgEnum('vault_kind', ['IMAGE', 'VIDEO', 'AUDIO']);

export const vaultItemSchema = pgTable(
  'vault_item',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    creatorId: text('creator_id')
      .notNull()
      .references(() => creatorSchema.id, { onDelete: 'cascade' }),
    kind: vaultKindEnum('kind').notNull(),
    r2Key: text('r2_key').notNull(),
    filename: text('filename').notNull(),
    thumbnailR2Key: text('thumbnail_r2_key'),
    sizeBytes: bigint('size_bytes', { mode: 'number' }),
    width: bigint('width', { mode: 'number' }),
    height: bigint('height', { mode: 'number' }),
    durationMs: bigint('duration_ms', { mode: 'number' }),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    uploadedBy: text('uploaded_by').references(() => memberSchema.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    orgCreatorIdx: index('vault_org_creator_idx').on(
      table.organizationId,
      table.creatorId,
    ),
  }),
);

// Records each (vault_item, fan) send pair. Powers "already sent" warnings.
export const vaultSendSchema = pgTable(
  'vault_send',
  {
    id: text('id').primaryKey(),
    vaultItemId: text('vault_item_id')
      .notNull()
      .references(() => vaultItemSchema.id, { onDelete: 'cascade' }),
    threadId: text('thread_id')
      .notNull()
      .references(() => threadSchema.id, { onDelete: 'cascade' }),
    fanId: text('fan_id')
      .notNull()
      .references(() => fanSchema.id, { onDelete: 'cascade' }),
    messageId: text('message_id').references(() => messageSchema.id, {
      onDelete: 'set null',
    }),
    sentAt: timestamp('sent_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    itemFanUnique: uniqueIndex('vault_send_item_fan_unique').on(
      table.vaultItemId,
      table.fanId,
    ),
    threadIdx: index('vault_send_thread_idx').on(table.threadId),
  }),
);

// ----- Monitoring & oversight -----

export const presenceStatusEnum = pgEnum('presence_status', [
  'ONLINE',
  'AWAY',
  'OFFLINE',
]);

export const chatterPresenceSchema = pgTable('chatter_presence', {
  memberId: text('member_id')
    .primaryKey()
    .references(() => memberSchema.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationSchema.id, { onDelete: 'cascade' }),
  lastSeenAt: timestamp('last_seen_at', { mode: 'date' }).defaultNow().notNull(),
  status: presenceStatusEnum('status').notNull().default('OFFLINE'),
});

export const flagTypeEnum = pgEnum('flag_type', [
  'GOOD_EXAMPLE',
  'NEEDS_REVIEW',
  'BAD_RESPONSE',
]);

export const messageFlagSchema = pgTable(
  'message_flag',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    messageId: text('message_id')
      .notNull()
      .references(() => messageSchema.id, { onDelete: 'cascade' }),
    flaggedBy: text('flagged_by')
      .notNull()
      .references(() => memberSchema.id, { onDelete: 'cascade' }),
    flagType: flagTypeEnum('flag_type').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    orgTypeCreatedIdx: index('flag_org_type_created_idx').on(
      table.organizationId,
      table.flagType,
      table.createdAt,
    ),
  }),
);

// ----- Assignment rules (auto-route inbound threads to chatters) -----

export const assignmentRuleSchema = pgTable(
  'assignment_rule',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationSchema.id, { onDelete: 'cascade' }),
    priority: bigint('priority', { mode: 'number' }).notNull(),
    matchJson: text('match_json').notNull(), // JSON-encoded match criteria
    assignTo: text('assign_to').notNull(), // memberId or 'round-robin'
  },
  table => ({
    orgPriorityIdx: index('rule_org_priority_idx').on(
      table.organizationId,
      table.priority,
    ),
  }),
);
