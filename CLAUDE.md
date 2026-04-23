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

### API layout
- Public reads: [app/api/companies/](app/api/companies/), [app/api/insurances/](app/api/insurances/), [app/api/settings/](app/api/settings/).
- Admin writes: [app/api/admin/](app/api/admin/) — `insurances`, `companies`, `categories`, `tags`, `settings`.
- All routes import `prisma` from [app/lib/prisma.ts](app/lib/prisma.ts), which is a global singleton wrapping `new PrismaClient({ adapter: new PrismaPg(...) })`.

### Services vs DB (known inconsistency)
[app/services/company.ts](app/services/company.ts) currently returns **hardcoded sample data** — it does *not* hit Prisma. The public pages under `app/(public)/[locale]/` (e.g. `CompanyListSection`) consume these services. The admin CMS and `/api/admin/*` routes hit Prisma. Before changing service signatures or sample data, verify which callers read from which.

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