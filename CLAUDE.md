# CLAUDE.md

Local booking platform for tier-2/3 Indian cities (starting with Bareilly): sports venue slot booking, event ticketing, open games, memberships.

The full roadmap is in `docs/PLAN.md`. Work on **one phase at a time** and only on what that phase lists. Tick checkboxes in `docs/PLAN.md` when items are done.

## Stack

- pnpm + Turborepo monorepo: `apps/web` (Next.js App Router, TS, Tailwind, shadcn/ui, TanStack Query, next-intl en/hi), `apps/api` (Node, TS, Express, Mongoose, Zod), `packages/shared` (Zod schemas, types, utils).
- MongoDB (replica set required), Razorpay, Resend, Cloudinary, Socket.io, Agenda.
- No WhatsApp Business API yet. Use `wa.me` click-to-chat links where WhatsApp is needed.

## Rules

- TypeScript strict. No `any` without a comment explaining why.
- Request/response shapes come from Zod schemas in `packages/shared`; don't duplicate types.
- Money is always an integer in **paise**. Never use floats for money.
- Slot dates are `YYYY-MM-DD` and times `HH:mm` strings in **IST**. Timestamps are UTC `Date`.
- Never bypass the `slotLocks` unique index for any booking path (online, walk-in, block, batch). See PLAN.md §3.
- Razorpay webhooks are the source of truth and must be idempotent. Always verify signatures.
- Owners may only access their own business data — enforce in the service layer.
- Error format: `{ error: { code, message, details? } }`.
- Mobile-first UI; test at 360px width. All user-facing strings go through next-intl (en + hi).
- Write tests with each feature (Vitest + Supertest + mongodb-memory-server). Concurrency-sensitive code (holds, tickets, open-game spots) needs a parallel-request test.

## Commands

- `pnpm dev` — run web + api
- `pnpm test` — all tests
- `pnpm lint` / `pnpm typecheck`
- `docker compose up -d` — local Mongo replica set

## Two repos

- **Townplay-client** (this repo): `apps/web` (Next.js). Deploy: Vercel.
- **Townlplay-server**: `apps/api`, `packages/shared`. Deploy: Render.
- `@townplay/shared` comes from the server's GitHub Release tarball `shared-v<version>` (pinned URL in `apps/web/package.json`). Never copy schemas here. For local cross-repo work, `pnpm link` the server's `packages/shared`.
- The browser calls the api via the Next rewrite `/v1/*` → `API_URL` (same-origin, first-party auth cookies). better-auth client: `src/lib/auth-client.ts` (basePath `/v1/auth`); api calls: `src/lib/api.ts`.

## Web layout

`apps/web/src`: `env.ts` (Zod; server `API_URL`, public `NEXT_PUBLIC_*`) · `i18n/` (locale from the `NEXT_LOCALE` cookie, no URL prefix; `setLocale` server action) · `app/` · `components/ui` (shadcn-style) · `messages/{en,hi}.json` (keys must match; tested) · `lib/server-api.ts` (`serverGet` for server components, straight to `API_URL`, cached) · `lib/api.ts` (`api.get/send` in the browser via the rewrite) · `components/auth-gate.tsx` · `components/owner/*`.

- Public pages (`/[city]`, `/[city]/venues/[slug]`) are server-rendered; filters are a plain GET form so they work without JS. Owner (`/owner`) and admin (`/admin/review`) pages are client-rendered behind `AuthGate`.
- Images: Cloudinary URLs via `lib/images.ts` `imageUrl(url, width)`; photos are compressed in the browser (`lib/compress.ts`) before a signed upload.
