# Week 1 Resume Runbook

Step-by-step for the 5 remaining tasks. Each task lists the **exact** clicks and commands. Estimated total: 30-45 min for T4+T12+T15, 15-25 min for T16, 5 min for T17.

---

## T4 — Clerk dev environment (≈10 min)

1. Open https://dashboard.clerk.com and sign in (or create a Clerk account if you don't have one — free).

2. Click **+ Create application**. Fill:
   - **Application name:** `tele-crm-dev`
   - **How will your users sign in?** Check **Email** (turn on Email + Password). Leave Google / GitHub / passkeys off for now.
   - Click **Create application**.

3. Sidebar → **Configure → API keys**. Copy these two values:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_`)

4. Sidebar → **Configure → Organization Management**:
   - Toggle **Enable organizations** → ON.
   - **Membership / Verified domains** → leave default for now.
   - Under **Default role for new members** → ensure `org:member` is selected.
   - Save.

5. In your terminal:
   ```bash
   cd ~/code/tele-crm
   cp .env .env.local
   ```

6. Open `~/code/tele-crm/.env.local` in your editor. Replace these two lines:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_<paste yours from step 3>
   CLERK_SECRET_KEY=sk_test_<paste yours from step 3>
   ```
   Leave `CLERK_WEBHOOK_SECRET=` empty for now — T12 fills it.

7. Verify:
   ```bash
   npm run dev
   ```
   - Visit http://localhost:3000.
   - You should see the Tele-CRM landing page with a "Sign in" button.
   - Click Sign Up → create a test user with your real email (you'll get a verification code).
   - You should land on `/dashboard` after sign-up (or be redirected to `/onboarding/organization-selection` — that's correct).
   - Stop the dev server with Ctrl+C.

**Done?** ✅ Move to T12.

---

## T12 — Clerk webhook registration (≈10 min)

This makes Clerk forward org/member events to your local app. Without it, you can sign up and create orgs but no rows will appear in your `organization` or `member` tables.

1. Install ngrok if you don't have it:
   ```bash
   brew install ngrok
   ngrok config add-authtoken <token from https://dashboard.ngrok.com/get-started/your-authtoken>
   ```

2. In one terminal, start the dev server:
   ```bash
   cd ~/code/tele-crm
   npm run dev
   ```

3. In another terminal, start ngrok pointing at the dev server:
   ```bash
   ngrok http 3000
   ```
   Note the public URL printed (e.g. `https://abc-123-xyz.ngrok-free.app`).

4. In Clerk dashboard → sidebar → **Configure → Webhooks** → **+ Add Endpoint**:
   - **Endpoint URL:** `https://abc-123-xyz.ngrok-free.app/api/webhooks/clerk` (use your actual ngrok URL)
   - **Subscribe to events:** check the boxes for:
     - `organization.created`
     - `organization.updated`
     - `organizationMembership.created`
     - `organizationMembership.updated`
     - `user.updated`
   - Click **Create**.

5. On the newly-created webhook page, copy the **Signing Secret** (starts with `whsec_`).

6. Add to `~/code/tele-crm/.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_<paste yours>
   ```

7. Restart dev server (Ctrl+C, then `npm run dev`) so the new env var is picked up.

8. Test from Clerk dashboard: webhook page → **Testing** tab → choose `organization.created` → **Send Example**. Check the **Message Attempts** tab — should see a 200 response.

**Done?** ✅ Move to T15.

---

## T15 — End-to-end smoke test (≈10 min)

Confirms the data flow: Clerk event → webhook → Drizzle → Postgres.

1. With dev server + ngrok still running, open http://localhost:3000.

2. If you signed up during T4, sign out. We want to re-test the full path.

3. Sign up as a new user (use a fresh email like `oli+smoke1@yourdomain.com` — Clerk supports plus-addressing).

4. After email verification you should land on `/onboarding/organization-selection`. Create an org named `BADAGENCY-SMOKE`.

5. You should land on `/dashboard`. The nav should show the org switcher with `BADAGENCY-SMOKE` selected.

6. In a third terminal, open Drizzle Studio:
   ```bash
   cd ~/code/tele-crm
   npm run db:studio
   ```
   Opens https://local.drizzle.studio in your browser.

7. Check the `organization` table — should have a row with `name = BADAGENCY-SMOKE` and an `id` starting with `org_`.

8. Check the `member` table — should have a row with:
   - `id` = a synthetic cuid (like `clx...`)
   - `clerk_user_id` = your Clerk user id (starts with `user_`)
   - `organization_id` = the org id from step 7
   - `role = OWNER`
   - `email` = your signup email

9. **Multi-org sanity check:** Back in the app, use the org switcher → create a second org `BADAGENCY-SMOKE-2`. In Drizzle Studio, refresh the `member` table — there should now be TWO rows for your user, same `clerk_user_id`, different `organization_id`, different `id`. The unique index prevents duplicates.

If all checks pass: ✅ T15 done.

If `organization` or `member` table is empty after creating an org: webhook isn't firing. Debug:
- Check ngrok dashboard (`http://localhost:4040`) for incoming POST requests to `/api/webhooks/clerk`. They should be 200.
- Check the Clerk webhook page → Message Attempts → look for failures.
- Check your terminal running `npm run dev` for error logs.
- Common causes: ngrok URL changed (it does on every restart unless you have a paid ngrok plan), webhook secret mismatch.

---

## T16 — Railway prod deploy (≈15-20 min)

1. Open https://railway.app/new and sign in (or sign up — free tier covers this).

2. Click **Empty Project** → name it `tele-crm-prod` → Create.

3. In the project canvas, click **+ New** → **Database** → **PostgreSQL**. Railway provisions a Postgres instance and exposes `DATABASE_URL` automatically.

4. Click **+ New** → **GitHub Repo** → authorize Railway → select `olioliolioliv/tele-crm`. Branch: `main` (or `chore/week-1-scaffold` for now — change after PR merges).

5. The first deploy will fail — env vars aren't set yet. That's expected.

6. Click on the Next.js service → **Variables** tab → add these one by one:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | (paste same value as `.env.local`) |
   | `CLERK_SECRET_KEY` | (paste same value as `.env.local`) |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
   | `DATABASE_URL` | Click "Reference" → select `Postgres.DATABASE_URL` |
   | `CLERK_WEBHOOK_SECRET` | (leave blank for now — register a new webhook for the prod URL later) |

7. Click **Redeploy**. Wait for build (~3-5 min).

8. Once deployed, Railway gives you a URL like `https://tele-crm-production.up.railway.app`. Open it.

9. The landing page should load. Sign-up will work but webhook events won't sync until you register a prod webhook (separate step you can do later — same flow as T12 but pointed at the Railway URL, no ngrok needed).

**Done?** ✅ Move to T17.

---

## T17 — Merge the PR (≈5 min)

The PR is already open as a draft at https://github.com/olioliolioliv/tele-crm/pulls.

1. Visit the draft PR. Verify the diff is what you expect (9 feature commits + 1 docs commit).

2. Review the changes (or skip if you trust the work).

3. Click **Ready for review** → then **Merge pull request** → squash or merge commit, your call.

4. Pull the merged main into your local:
   ```bash
   cd ~/code/tele-crm
   git checkout main
   git pull
   git branch -d chore/week-1-scaffold
   ```

**Week 1 done.** Move to Week 2 (agency interviews) per the spec.

---

## Troubleshooting

- **`npm run dev` says "Port 3000 in use"**: another process is on 3000. Either kill it (`lsof -i :3000` to find what) or let Next pick 3001 (it does automatically). If 3001, update ngrok command to `ngrok http 3001` and Clerk webhook URL accordingly.

- **Build fails with "Invalid environment variables"**: an env var is missing or mistyped in `.env.local`. The error message lists which one.

- **`npm run db:studio` opens but tables are empty**: that's fine before T15. After T15, refresh the browser tab if data doesn't appear immediately.

- **Sign-up succeeds but `/dashboard` shows a 500 error**: probably means the Clerk webhook hasn't fired and the `member` table is empty, but middleware tries to read it. Check the webhook delivery in Clerk dashboard.

- **Clerk webhook returns 401 invalid signature**: `CLERK_WEBHOOK_SECRET` in `.env.local` doesn't match the value in the Clerk dashboard. Re-copy and restart dev server.
