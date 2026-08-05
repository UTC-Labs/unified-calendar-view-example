# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 16 example app demonstrating the Apiroc Calendar API — a unified calendar interface that aggregates Google and Microsoft calendar accounts, allowing users to view, create, update, and delete events across providers.

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Type check:** `pnpm check` (or `pnpm typecheck`)
- **Format check:** `pnpm format:check`
- **Format fix:** `pnpm format:write`
- **DB migrations:** `pnpm db:generate` (create migration), `pnpm db:migrate` (apply), `pnpm db:push` (push schema without migration)
- **DB GUI:** `pnpm db:studio`

No test framework is configured.

## Architecture

### Stack

Next.js 15 (App Router) + React 19 + TypeScript, with tRPC for type-safe API calls, Prisma + PostgreSQL for persistence, better-auth for authentication (Google/Microsoft OAuth), and Tailwind CSS + shadcn/ui for styling.

### Key Patterns

**tRPC API layer** (`src/server/api/`): Routers live in `src/server/api/routers/` (calendar-events, calendar-accounts, calendars). The root router in `root.ts` aggregates them. Procedures are either `publicProcedure` or `protectedProcedure` (requires auth session). tRPC client setup is in `src/trpc/`.

**Apiroc API client** (`src/server/lib/apiroc/`): `client.ts` exports `apirocClient`, a configured instance of `UnifiedCalendarApi` from the `@apiroc/unified-calendar-api-node-sdk` package. The SDK provides the resource clients (`endUserAccounts`, `calendars`, `events`, `basicAuth`) and the request/response types. All external calendar operations go through this client.

**Authentication** (`src/server/auth.ts`): Uses better-auth with Prisma adapter. Social login via Google and Microsoft. Sessions are checked in protected routes/procedures.

**Route groups** (`src/app/`): `(auth)` for login/signup pages, `(protected)/(calendar)` for the main calendar views (requires auth), `api/` for API routes (tRPC endpoint, auth handlers, OAuth callback at `/api/connect`).

**Calendar UI**: Uses react-big-calendar with date-fns localizer. Supports day/week/month views. Recurring events are expanded client-side using the `rrule` library.

**Database schema** (`prisma/schema.prisma`): Core models are User → CalendarAccount → Calendar. CalendarAccount stores the `unifiedAccountId` linking to the Apiroc API. Calendar stores `unifiedCalendarId`. Events are not persisted locally — they're fetched from the Apiroc API at runtime.

**Environment validation** (`src/env.js`): Uses `@t3-oss/env-nextjs` with Zod schemas. All env vars must be declared here. Set `SKIP_ENV_VALIDATION=1` to bypass during builds.

### Path Aliases

`@/` maps to `src/` (configured in tsconfig.json).
