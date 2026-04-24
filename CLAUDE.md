# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm**. Runtime is **Node ≥ 20.19** with ESM + TypeScript.

```bash
pnpm dev                  # Next.js dev server (default :3000)
pnpm build                # Production build
pnpm start                # Start built app
pnpm lint                 # ESLint (flat config in eslint.config.mjs)
pnpm prisma:generate      # Regenerate Prisma client into app/generated/prisma
pnpm check-db             # Smoke-test DB connectivity + row counts (tsx check-db.ts)

pnpm prisma migrate dev --name <name>   # Create + apply a new migration
pnpm prisma migrate deploy              # Apply pending migrations (prod)
```

Production is managed by PM2 as app `mcins` on **port 3075** ([ecosystem.config.cjs](ecosystem.config.cjs)). Deploy via [deploy.sh](deploy.sh), which wipes `.next`, rebuilds, restarts PM2, then clears Nginx cache.

## Architecture

### Next.js App Router split into route groups
The UI tree is split into two route groups with **per-group root layouts** — there is no shared `app/layout.tsx`. Route groups (`(public)`, `(admin)`) don't appear in URLs; they exist only to keep the two audiences' layouts and assets isolated.

- `app/(public)/[locale]/` — public site. `layout.tsx` is the root for this group: owns `<html lang={locale}><body>`, sets up `NextIntlClientProvider` + `AppProvider`, loads the Phetsarath font, and renders `<NavigationBar />{children}<Footer />`. URLs: `/`, `/en/*`, `/lo/*`.
- `app/(admin)/admin/` — CMS UI. `layout.tsx` is the root for this group: owns its own `<html><body>`, imports `../../globals.css`, and renders the sidebar/header shell. **Unlocalized** — no `[locale]` segment; menu items and `router.push` targets are hard-coded `/admin/*`. URLs: `/admin/*`.
- API routes live at `app/api/` (public reads) and `app/api/admin/` (admin writes) — **not** inside either route group, by design.
- [proxy.ts](proxy.ts) matcher is `['/', '/(lo|en)/:path*']` — matches public only. Admin is intentionally skipped.
- Locales: `en`, `lo`; **default is `lo`** ([i18n/routing.ts](i18n/routing.ts)). Messages live in [messages/en.json](messages/en.json) and [messages/lo.json](messages/lo.json), loaded by [i18n/request.ts](i18n/request.ts).

Because the groups are separate root-layout trees, adding shared app-wide chrome requires touching **both** group layouts; there's no common ancestor.

### Data model: the metadata table pattern
[prisma/schema.prisma](prisma/schema.prisma) intentionally keeps translatable fields out of the primary tables. Instead, every `Company`, `InsuranceCategory`, and `Insurance` has a sibling `*Metadata` table keyed `(entityId, locale, key)`:

- `name` / `description` live as rows in `CompanyMetadata`, `InsuranceCategoryMetadata`, `InsuranceMetadata`.
- `InsuranceContent` is separate: one row per `(insuranceId, locale)` holding TipTap `contentJson`, `contentHtml`, `contentText`, plus `images`, `version`, `isPublished`.
- `Setting` is `(key, locale)`-unique for site-wide localized config.

When reading/writing an entity, **always scope `metadata`/`content` includes with `where: { locale }`**. Example of the read pattern in [app/api/admin/insurances/route.ts](app/api/admin/insurances/route.ts#L30-L64): fetch with relations filtered by locale, then in post-processing pull `metadata.find(m => m.key === 'name')?.value`.

When creating an insurance, metadata rows are emitted in two passes — once per `(locale, key='name')` and once per `(locale, key='description')` — see [route.ts:167-178](app/api/admin/insurances/route.ts#L167-L178).

**Soft-delete on Company** ([prisma/schema.prisma](prisma/schema.prisma)): `Company.isActive` defaults to `true`. **Public services must filter `where: { isActive: true }`** ([app/services/company.ts](app/services/company.ts)) — archived companies stay in the DB but disappear from the public site. Admin queries ignore the flag. Hard-delete is allowed only when `insurances.count === 0`; otherwise the DELETE endpoint returns 409 (`Insurance.companyId` has `onDelete: Restrict`).

**Audit fields**: both `Insurance` and `Company` carry nullable `createdBy` / `updatedBy` — `Admin.id` strings, not FK relations. Handlers set them from [`getSessionAdmin()`](app/lib/session.ts). Rows that predate the column (e.g., the 22 companies seeded from `scripts/migrate-companies-to-db.ts`) have `null` there.

### API layout
- Public reads: [app/api/companies/](app/api/companies/), [app/api/insurances/](app/api/insurances/), [app/api/settings/](app/api/settings/).
- Admin writes: [app/api/admin/](app/api/admin/) — `insurances`, `companies`, `categories`, `tags`, `settings`.
- All routes import `prisma` from [app/lib/prisma.ts](app/lib/prisma.ts), which is a global singleton wrapping `new PrismaClient({ adapter: new PrismaPg(...) })`.

### Services layer (Prisma-backed)
The public site reads through a thin services layer in [app/services/](app/services/) — **not** directly from Prisma. Both files are now DB-backed; the old hardcoded sample arrays are gone.

- [app/services/company.ts](app/services/company.ts): `getCompanyList(locale)` and `getCompany(id, locale)` query Prisma with `isActive: true`, resolve localized `name`/`description` from `CompanyMetadata` (falls back to `en`), and derive `available_insurances` from distinct `category.slug` values of that company's **PUBLISHED** insurances. `getCompany` returns `undefined` for archived rows so `/<locale>/company/<id>` renders "not found".
- [app/services/insurance.ts](app/services/insurance.ts): `getInsurancesByCompanyId(companyId, locale)` filters `status: 'PUBLISHED'`, orders by `featured`/`priority`/`createdAt`, and maps `InsuranceCategory.slug` into `InsuranceResponse.category` (which feeds [`getInsuranceLogo`](app/utils/index.ts)).

Callers must pass `locale`: public pages get it from `params.locale`, `AppContext.fetchCompanies` gets it from `useLocale()`, and the public API routes ([app/api/companies/](app/api/companies/), [app/api/insurances/](app/api/insurances/)) read `?locale=` (default `en`).

### Seed / backfill scripts
- [scripts/migrate-companies-to-db.ts](scripts/migrate-companies-to-db.ts) — idempotent `upsert` by `slug` for the 21 original companies with en/lo metadata. Already run; safe to re-run.
- [scripts/migrate-company-logos-to-slug.ts](scripts/migrate-company-logos-to-slug.ts) — one-off: copies each company's logo from the legacy numeric path (`companies/<numeric>/logo.<ext>`) to the slug path (`companies/<slug>/logo.<ext>`), updates `company.logo`, deletes the old object. Idempotent (skips already-correct paths); supports `--dry-run`. Already run for the initial 21 rows.

## Storage (MinIO S3 at `https://s3.mcins.la/mcins`)

User-uploaded images live in a MinIO bucket. Uploads go through a **server-proxy** endpoint — browser credentials never touch MinIO.

- **Endpoint**: [app/api/admin/upload/route.ts](app/api/admin/upload/route.ts) accepts `multipart/form-data` with `file`, `scope`, and (depending on scope) `entityId` or `entityKey`. Validates size (≤10MB) and MIME (`image/{jpeg,png,webp,gif,svg+xml}`). Returns `{ url, key }`.
- **Client**: [app/lib/s3.ts](app/lib/s3.ts) is the singleton `S3Client` wrapped like `app/lib/prisma.ts`. `forcePathStyle: true` is **required** — MinIO does not support virtual-hosted-style URLs.
- **Reusable UI**: [app/(admin)/admin/components/ImageUpload.tsx](app/(admin)/admin/components/ImageUpload.tsx) — drop-target + file picker. The TipTap editor in [RichTextEditor.tsx](app/(admin)/admin/components/RichTextEditor.tsx) has its own inline wiring (hidden input + toolbar button) that hits the same endpoint with `scope=insurance-content`.

### Key layout (structured by entity)

| Scope | Key pattern |
|---|---|
| `insurance-content` | `insurances/content/<uuid>.<ext>` — **not** per-insurance (see compromise below) |
| `insurance-image` | `insurances/<insuranceId>/<uuid>.<ext>` |
| `company-logo` | `companies/<slug>/logo.<ext>` — upload endpoint resolves slug by `entityId` (company UUID); overwrites on re-upload. Renaming a slug via PUT `/api/admin/companies/[id]` auto-renames the S3 object (copy → update DB → delete old; rolls back the copy if the DB update fails). |
| `banner` | `banners/<uuid>.<ext>` |
| `setting` | `settings/<entityKey>.<ext>` |

**Compromise**: `insurance-content` (images dropped into the TipTap editor) is flat under `insurances/content/` rather than scoped by insurance ID. Reason: the create form opens before the insurance has an ID, and copy/rename-on-save is complexity we don't want. Trade-off: abandoned-draft uploads become orphans — cleaned up via the orphan cleanup tool (next section).

### Bucket access

Bucket `mcins` is **public-read** for all objects — anonymous `GET` works. Public pages render `<img src="https://s3.mcins.la/mcins/…">` directly, no signed URLs at render time. The public-read policy is applied on the MinIO side (see plan `/root/.claude/plans/plan-first-ask-me-zazzy-scone.md` for the JSON).

### Env vars (in [.env](.env))

```
S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION, S3_PUBLIC_BASE_URL
```

`S3_REGION` is ignored by MinIO but required by the AWS SDK. `S3_PUBLIC_BASE_URL` is the render-time URL prefix and may differ from `S3_ENDPOINT` behind a CDN.

### Migration of existing assets

`scripts/migrate-assets-to-s3.ts` (run with `tsx scripts/migrate-assets-to-s3.ts`) uploads the 21 sample company logos, 3 banners, and `logo.png` to MinIO under the key layout above. Idempotent — safe to re-run. The referencing code ([app/services/company.ts](app/services/company.ts), `NavigationBar`, `HeroSection`) already points at the MinIO URLs, so the migration script must run before those URLs resolve. Bucket bootstrap (create bucket + apply public-read policy) is a separate one-off: `scripts/setup-minio-bucket.ts`.

### Next.js image optimization

[next.config.ts](next.config.ts) whitelists `s3.mcins.la` in `images.remotePatterns`, so `next/image` `<Image>` components can optimize MinIO-hosted assets. Plain `<img>` tags don't need this.

### Orphan cleanup

The CMS has a manual cleanup tool at [/admin/cleanup](app/(admin)/admin/cleanup/page.tsx) backed by [app/api/admin/cleanup/orphans/route.ts](app/api/admin/cleanup/orphans/route.ts). It's the recovery valve for the `insurance-content` compromise above.

**Flow** is `preview → select → delete`:
- `GET /api/admin/cleanup/orphans?minAgeHours=N` lists objects under `insurances/` that are (a) **not referenced** anywhere in the DB and (b) older than `N` hours. Default `minAgeHours=24`.
- `DELETE /api/admin/cleanup/orphans` with body `{ keys: [...] }` deletes the selected objects.

**Reference extraction** ([app/lib/orphans.ts](app/lib/orphans.ts)) — `collectReferencedKeys()` walks:
- `InsuranceContent.contentJson` — recursive TipTap tree walk, collects `type === 'image'` nodes' `attrs.src`.
- `InsuranceContent.contentHtml` — regex `<img [^>]*src="…">`.
- `InsuranceContent.images[]` — string array.
- `Company.logo`, `Setting.value`.

Only URLs starting with `S3_PUBLIC_BASE_URL` are turned into keys via [`keyFromPublicUrl()`](app/lib/s3.ts); external URLs are ignored. If you add a new DB field that stores a MinIO URL, **extend `collectReferencedKeys` or it will be deleted as an orphan**.

**Guardrails in the DELETE handler**:
1. **Prefix allow-list** — rejects any key not under `insurances/`. `companies/`, `banners/`, `site/`, `settings/` are immune.
2. **Re-check before delete** — re-runs `collectReferencedKeys()` right before `DeleteObjects`, so uploads that raced between the scan and the delete are skipped (returned as `skippedNowReferenced`).

**S3 helpers** in [app/lib/s3.ts](app/lib/s3.ts): `listObjects(prefix)` (paginated), `deleteObjects(keys)` (batched at 1000 per request — the S3 hard limit), `keyFromPublicUrl(url)`.

## Authentication

Both `/admin/*` pages and `/api/admin/*` routes are gated behind a signed-in admin session. The lone exceptions are the login page itself and the login/logout endpoints.

- **Mechanism**: hand-rolled JWT in an HttpOnly cookie (`mcins_session`), signed with `jose` (HS256, `JWT_SECRET`). No `next-auth`, no refresh tokens — the plan file at `/root/.claude/plans/admin-auth.md` has the rationale.
- **Storage model**: `Admin` Prisma model (email + `passwordHash`). Password hashed with `bcryptjs` (cost 10, min 8 chars). Users are **created via CLI**, not through any UI.
- **Session window**: `JWT_EXPIRES_IN` (default 1d). Sliding expiration — the middleware re-issues the cookie on any request made when >50% of the lifetime has elapsed, so active sessions don't die mid-work.

### Enforcement

[proxy.ts](proxy.ts) dispatches by URL prefix:

| Path prefix | Behavior |
|---|---|
| `/admin/*` | JWT verified; redirect to `/admin/login?next=<original>` on failure |
| `/api/admin/*` | JWT verified; return `401 {"error":"unauthorized"}` on failure |
| `/`, `/(lo\|en)/*` | Passed to next-intl unchanged |

Both admin guards also slide the cookie when appropriate.

Exempt from the guard: `/admin/login`, `/api/admin/login`, `/api/admin/logout`.

**Route-level checks are not required.** If a request reaches a `/api/admin/*` handler, the middleware already verified the session. Handlers that need the admin identity (e.g. for `createdBy`/`updatedBy` audit fields) call [`getSessionAdmin()`](app/lib/session.ts) from [app/lib/session.ts](app/lib/session.ts) — it reads the cookie and returns `{ id, email } | null`.

### Files

- [app/lib/auth.ts](app/lib/auth.ts) — `signSession`, `verifySession`, `shouldSlide`, cookie option helpers. Edge-runtime safe (used by middleware).
- [app/lib/password.ts](app/lib/password.ts) — `hashPassword`, `verifyPassword`. Node-runtime only (bcrypt is CPU-bound).
- [app/lib/session.ts](app/lib/session.ts) — server-only `getSessionAdmin()` / `requireSessionAdmin()`. Reads the cookie jar via `next/headers`.
- [app/api/admin/login/route.ts](app/api/admin/login/route.ts) — POST login. In-process rate limit: 5 attempts / 15 min / IP.
- [app/api/admin/logout/route.ts](app/api/admin/logout/route.ts) — POST logout (clears cookie).
- [app/api/admin/me/route.ts](app/api/admin/me/route.ts) — GET logged-in admin's identity. The admin sidebar calls this to show the real email + initial.
- [app/(admin)/admin/login/page.tsx](app/(admin)/admin/login/page.tsx) — login form.
- [scripts/create-admin.ts](scripts/create-admin.ts) — CLI: `pnpm exec tsx scripts/create-admin.ts <email> <password> [name]`. Idempotent — re-running with the same email updates the hash.

### Bootstrapping the first admin

```bash
pnpm exec tsx scripts/create-admin.ts you@example.com 'strongpass' 'Your Name'
```

There is no in-app signup. The script must run against a DB the admin has shell access to.

### Cookie attributes

HttpOnly; `Secure` in production (not in dev, since `http://localhost:3000` wouldn't accept it); `SameSite=Lax` (strict breaks post-login redirects); `Path=/`; `Max-Age` = `JWT_EXPIRES_IN`.

### Force-logout everyone

There is no per-device revocation — stateless JWTs can't be revoked mid-life. To invalidate all existing sessions, rotate `JWT_SECRET` in `.env` and restart. All in-flight tokens become invalid on the next request.

### What's intentionally not here

- No password reset (no email provider wired).
- No MFA / OAuth / social login.
- No role-based access control — all admins have full access.
- Rate limit is in-process only (single-PM2-instance assumption). Move to Redis if the app scales horizontally.
- SameSite=Lax is the only CSRF protection. No CSRF token scheme; fine for same-origin admin CRUD.

## Prisma v7 specifics (important)

This project has been migrated to Prisma 7. Read [PRISMA V7 MIGRATION](PRISMA%20V7%20MIGRATION) before touching Prisma config. Key deviations from v6 muscle memory:

- Generator is `provider = "prisma-client"` (not `prisma-client-js`) with `output = "../app/generated/prisma"`. Import from `@/app/generated/prisma/client`, not `@prisma/client`.
- The `datasource db` block in [schema.prisma](prisma/schema.prisma) has **no `url`** — it's configured in [prisma.config.ts](prisma.config.ts) via `env("DATABASE_URL")`.
- Runtime uses the **`@prisma/adapter-pg` driver adapter** with direct TCP (see [app/lib/prisma.ts](app/lib/prisma.ts)). Every script that instantiates `PrismaClient` must pass `adapter`, including seeds and ad-hoc scripts — see [check-db.ts](check-db.ts) as the reference pattern.
- CLI flags `--schema` and `--url` are gone from `prisma db execute`; `prisma migrate diff` uses `--from-config-datasource` / `--to-config-datasource`.
- **Known bug with `@map` on enums** (v7.2.0): generated TS types use mapped values but the engine expects schema names, causing runtime errors. The current `InsuranceStatus` enum has no `@map`, so it's safe — keep it that way until upstream is fixed.

## Conventions

- Path alias `@/*` maps to repo root ([tsconfig.json](tsconfig.json)), so imports look like `@/app/lib/prisma`, `@/app/interfaces`, `@/i18n/routing`. Prefer this over relative paths — it's immune to route-group restructuring.
- TipTap editor content: always persist all three forms (`contentJson`, `contentHtml`, `contentText`) so downstream renderers can pick. `isPublished` should track `Insurance.status === 'PUBLISHED'`.
- Custom font: `Phetsarath` (Lao script) is loaded via `next/font/local` in `app/(public)/[locale]/layout.tsx` only. Admin deliberately does not use it.
- When adding a new translatable field, add a new `key` to the appropriate `*Metadata` table — do not add a column to the parent table.
- When linking within the public site, import `Link` / `useRouter` / `usePathname` from [@/i18n/routing](i18n/routing.ts) (not `next/link` / `next/navigation`) so the current locale is preserved. Admin pages use the plain `next/navigation` APIs since admin is unlocalized.