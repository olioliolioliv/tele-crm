# Week 1 — DONE

All 17 plan tasks complete. Phase 1 scaffold is live in both local dev and Railway production.

## Live environments

| Env | URL | Postgres | Webhook |
|---|---|---|---|
| **Local dev** | http://localhost:3000 | pglite (in-process) | https://revenue-massive-hacked.ngrok-free.dev/api/webhooks/clerk (ngrok tunnel) |
| **Production** | https://tele-crm-app-production.up.railway.app | Railway Postgres `ceba2684-505f-471d-9232-d861de78817e` | (not yet registered — see "Open follow-ups" below) |

## Verified end-to-end

**Local stack — proven live via Svix delivery log:**
- ✅ user.created × 2
- ✅ organization.created × 2
- ✅ organizationMembership.created × 2

DB state shows synced `organization` and `member` rows (per debug endpoint at `/api/debug/state`).

**Production stack:**
- ✅ Build succeeded (Next.js compile + Drizzle migrate)
- ✅ HTTP 200 on landing
- ✅ HTTP 400 on `/api/webhooks/clerk` without signature (validation works)
- Postgres reachable via internal `DATABASE_URL`

## Railway project

- Project: `tele-crm-prod` (id `bc534330-2da1-4f21-94b9-381354c3c295`)
- Service: `tele-crm-app` (id `75de0f46-bd58-42da-a475-7f8ae321d14e`)
- Service: `Postgres` (id `ceba2684-505f-471d-9232-d861de78817e`)
- Environment: `production` (id `77134357-c0d7-4864-ad9b-029b17272bab`)
- Domain: `tele-crm-app-production.up.railway.app`

## Open follow-ups (Week 2+)

These are not blockers — Phase 1 ships without them. Add when convenient.

1. **Production Clerk webhook.** Right now `CLERK_WEBHOOK_SECRET` in Railway is the dev signing secret. Sign-ups via prod URL won't sync to DB until you register a prod webhook (separate from the dev one) targeting `https://tele-crm-app-production.up.railway.app/api/webhooks/clerk`. Same flow as T12 but no ngrok.
2. **Auto-deploy from GitHub.** Currently `railway up` uploads the local dir. Connect the GitHub repo at https://railway.com/project/bc534330-2da1-4f21-94b9-381354c3c295/settings → "Connect a GitHub repo" so pushes to `main` auto-deploy.
3. **Switch Clerk to a prod Clerk app.** Currently using dev keys (`tgm-bot` Clerk app in development mode). For real users, create a separate Clerk app in production mode and update env vars.
4. **R2 bucket** (for vault uploads, week 7).
5. **Inngest** (for queues, when webhook volume justifies).
6. **Pusher** (for realtime chatter UI, week 4-5).

## How to deploy a new version

```bash
cd ~/code/tele-crm
RAILWAY_API_TOKEN=<your token> railway up --service tele-crm-app --detach
```

Or merge the PR and connect GitHub for auto-deploy (follow-up #2 above).

## Repo state

- Branch `chore/week-1-scaffold` → 13 commits, pushed to origin
- Draft PR open: https://github.com/olioliolioliv/tele-crm/pulls
- Working tree clean
