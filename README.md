# Tele-CRM

Multi-tenant agency CRM for Telegram-based creator monetization. Built for agencies managing chatters across multiple creators on Telegram.

**Status:** Phase 1 alpha — see `docs/specs/2026-05-21-tele-crm-design.md` for the design spec.

**Stack:** Next.js 14 · Clerk · Drizzle ORM · Postgres · Tailwind · Railway.

## Development

```bash
npm install
cp .env .env.local       # then fill in your Clerk + DB keys
npm run dev
```

Open http://localhost:3000.

## Database

```bash
npm run db:generate    # generate migration from schema changes
npm run db:migrate     # apply migrations
npm run db:studio      # open Drizzle Studio
```

Local development uses pglite (no separate DB process); production uses Railway-hosted Postgres.

## License

This project is based on [`ixartz/SaaS-Boilerplate`](https://github.com/ixartz/SaaS-Boilerplate) (MIT). Original work © Oli, all rights reserved.
