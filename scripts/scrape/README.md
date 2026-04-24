# Insurance site scrapers

Python scrapers that fetch insurer product catalogs from public websites and emit JSON
for the TypeScript seed scripts to consume. Lives outside the Node/Prisma toolchain
on purpose — Python is best-in-class for HTML scraping, and keeping the scrape
auditable in git (the JSON output) separates "what we pulled" from "what we wrote".

## Setup (once)

```bash
cd scripts/scrape
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
source venv/bin/activate   # if not already active
python3 agl.py             # writes out/agl.json
```

## Output

Each scraper writes to `out/<slug>.json` with a stable shape:

```json
{
  "company": { "slug": "allianz", "source_url": "...", "name_en": "...", "description_en": "..." },
  "products": [
    { "page_id": 694, "source_url": "...", "category_slug": "car", "name_en": "...", "description_en": "..." }
  ]
}
```

The TypeScript seeders in `../seed-*-insurances.ts` consume this shape and write to
the DB via Prisma + pg-adapter.

## Conventions

- `category_slug` values must match the canonical slugs in
  [app/utils/index.ts](../../app/utils/index.ts) (`life`, `health`, `accident`,
  `travel`, `home`, `car`, `business`). Map at scrape time — the seed script does
  not re-map.
- The scraper is read-only against the target site and does not hit any of our
  infrastructure. DB writes happen only in the TS seeders.
- Commit `out/*.json` so the scraped catalog is reviewable in PRs. Raw HTML
  (`out/*.raw.html`) is gitignored.
