# Week 1 — Where We Are

## What works (code-side)

- Fork of `ixartz/SaaS-Boilerplate` (MIT), renamed `tele-crm`.
- Boilerplate Stripe + landing-page templates stripped.
- Phase-1 domain schema in `src/models/Schema.ts` — 14 tables: `organization`, `member`, `creator`, `fan`, `thread`, `message`, `script`, `script_usage`, `vault_item`, `vault_send`, `activity_event`, `chatter_presence`, `message_flag`, `assignment_rule`.
- Initial migration `migrations/0000_tele_crm_initial.sql` ready to apply.
- Clerk webhook route at `src/app/api/webhooks/clerk/route.ts` — svix-verified handlers for `organization.created/updated`, `organizationMembership.created/updated`, `user.updated`. Synthetic-CUID member ids with `(clerk_user_id, organization_id)` natural unique key.
- Middleware bypass for `/api/webhooks/*` (skip Clerk auth + i18n).
- `requireTenant()` helper at `src/libs/Tenant.ts` + 5 tests, all passing.
- `OrganizationSwitcher` already wired in `DashboardHeader.tsx` (inherited from ixartz; verified, no new code needed).
- Middleware already redirects users without `orgId` to `/onboarding/organization-selection` (inherited).
- `npm run build` ✓
- `npm run check-types` ✓
- `npm test` ✓ (13/13 across 5 test files)

## What's NOT done yet

External account setup tasks (need human at dashboards):

| Task | Where | What |
|---|---|---|
| **T4** | clerk.com | Create `tele-crm-dev` app, enable Organizations, copy keys to `.env.local` |
| **T12** | clerk.com + ngrok | Tunnel localhost:3000, register webhook to `/api/webhooks/clerk`, copy signing secret to `.env.local` |
| **T15** | local browser | Smoke test: sign up, create org, verify rows in `organization` and `member` tables (use `npm run db:studio`) |
| **T16** | railway.app | Create `tele-crm-prod` project, add Postgres, connect GitHub, set env vars, deploy |
| **T17** | github.com | Open PR for `chore/week-1-scaffold`. Merge to `main` after smoke test passes. |

## Branch + commits

- Branch: `chore/week-1-scaffold`
- Pushed to: https://github.com/olioliolioliv/tele-crm

```
a2020c4 feat: requireTenant and tenantContext helpers
bf9afc9 feat: clerk webhook for org and member sync
8c75c5f feat: add svix and cuid2, drop stripe dep
58ae8d3 feat: generate initial migration for Phase 1 schema
07db5b3 feat: add Phase 1 domain schema
6d0f7a7 chore: remove example todoSchema
3ac5147 chore: strip Stripe billing and unused marketing templates
b166e74 chore: lock package versions after npm install
4c2518f chore: rename to tele-crm
```

## How to resume locally

```bash
cd ~/code/tele-crm
git pull
npm install         # safe to re-run
cp .env .env.local  # then fill in Clerk keys per Task 4
npm run dev
```

## Reference docs

- Design spec: `/Users/od/telegram bot tgm.bot/docs/specs/2026-05-21-tele-crm-design.md`
- Implementation plan: `/Users/od/telegram bot tgm.bot/docs/plans/2026-05-21-week-1-scaffold.md`
- Brain wiki on Concierge11 / Infloww / tgm.bot: `~/brain_obsidian/wiki/`

## Discoveries during execution

- ixartz already ships `<OrganizationSwitcher>` in `DashboardHeader.tsx` and middleware-level redirect to `/onboarding/organization-selection`. Task 13 in the plan simplifies to a verification step.
- ixartz's free version is thinner on multi-tenancy UI than the marketing implies; the substance is Clerk's free Organizations feature wrapped in some scaffolding.
- Clerk 6.x's `auth()` is async (`Promise<Auth>`) — caught by pre-commit `check-types`. Helper and tests are updated accordingly.
- Drizzle-kit prompts interactively when both adding and removing tables in the same diff — we wiped `migrations/` and regenerated to avoid the prompts (no data to lose).
