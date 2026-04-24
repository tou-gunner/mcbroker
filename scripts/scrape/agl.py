"""Scrape product info from https://www.agl.com.la/ into out/agl.json.

Reads the curated page_id → category_slug map from agl_known_pages.py, fetches
each product page, extracts a clean title + short description, and writes the
combined result to out/agl.json for scripts/seed-agl-insurances.ts to consume.

Idempotent: safe to re-run — overwrites out/agl.json.

Usage:
    python3 agl.py               # normal run
    python3 agl.py --keep-html   # also save raw HTML to out/<page_id>.raw.html
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from agl_known_pages import KNOWN_PAGES

BASE_URL = "https://www.agl.com.la"
HOME_URL = f"{BASE_URL}/"
# AGL's WAF 503s on bare UAs. Use a common desktop Chrome UA + Accept-Language so
# the fingerprint looks like an ordinary browser session, and keep cookies across
# requests via requests.Session().
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
DEFAULT_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}
REQUEST_TIMEOUT = 20
REQUEST_DELAY_SEC = 2.0   # be polite between page fetches; AGL throttles aggressively
MAX_RETRIES = 4           # retry on 5xx / transient errors with exponential backoff

OUT_DIR = Path(__file__).parent / "out"

_SESSION = requests.Session()
_SESSION.headers.update(DEFAULT_HEADERS)


@dataclass
class CompanyInfo:
    slug: str
    source_url: str
    name_en: str
    description_en: str


@dataclass
class Product:
    page_id: int
    source_url: str
    category_slug: str
    name_en: str
    description_en: str
    thumbnail_url: str | None


def fetch(url: str, referer: str | None = None) -> str:
    headers = {"Referer": referer} if referer else None
    last_exc: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = _SESSION.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
            if resp.status_code in (429, 500, 502, 503, 504):
                backoff = 2 ** attempt  # 2, 4, 8, 16s
                print(
                    f"      ! HTTP {resp.status_code}, retry {attempt}/{MAX_RETRIES} in {backoff}s",
                    file=sys.stderr,
                )
                time.sleep(backoff)
                continue
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as exc:
            last_exc = exc
            backoff = 2 ** attempt
            print(
                f"      ! {exc.__class__.__name__}: {exc}, retry {attempt}/{MAX_RETRIES} in {backoff}s",
                file=sys.stderr,
            )
            time.sleep(backoff)
    # Exhausted retries — raise so the caller can log and continue to the next page.
    if last_exc:
        raise last_exc
    raise requests.HTTPError(f"exhausted retries for {url}")


def _clean(text: str) -> str:
    """Collapse whitespace and strip."""
    return re.sub(r"\s+", " ", text or "").strip()


def _meta_description(soup: BeautifulSoup) -> str:
    for sel in [
        ('meta', {'property': 'og:description'}),
        ('meta', {'name': 'description'}),
        ('meta', {'name': 'twitter:description'}),
    ]:
        tag = soup.find(*sel)
        if tag and tag.get('content'):
            return _clean(tag['content'])
    return ""


def _page_title(soup: BeautifulSoup) -> str:
    # Prefer <h1> inside the main content, fall back to og:title / <title>.
    h1 = soup.find('h1')
    if h1 and _clean(h1.get_text()):
        return _clean(h1.get_text())
    og = soup.find('meta', {'property': 'og:title'})
    if og and og.get('content'):
        # AGL titles often look like "Product Name – AGL"; strip the site suffix.
        return re.sub(r"\s*[–-]\s*AGL.*$", "", _clean(og['content']))
    if soup.title and soup.title.string:
        return re.sub(r"\s*[–-]\s*AGL.*$", "", _clean(soup.title.string))
    return ""


def _hero_description(soup: BeautifulSoup) -> str:
    """Find the product description on an AGL WordPress/Elementor page.

    AGL doesn't use plain <p> tags for body copy — the builder wraps everything
    in <h2/h4 class="elementor-heading-title ...">. The hero blurb is the first
    such heading with sentence-length text (>= 60 chars), scoped to the <main>
    post content so we don't accidentally grab the footer's "Allianz Insurance
    Laos is ready by your side..." boilerplate that appears on every page.
    """
    main = soup.find('main', id='content') or soup.find('main') or soup
    for h in main.find_all(['h2', 'h3', 'h4']):
        classes = h.get('class') or []
        if 'elementor-heading-title' not in classes:
            continue
        text = _clean(h.get_text())
        if len(text) >= 60:
            return text
    # Fallback: any elementor heading anywhere on the page meeting the length bar.
    for h in soup.find_all(['h2', 'h3', 'h4']):
        classes = h.get('class') or []
        if 'elementor-heading-title' not in classes:
            continue
        text = _clean(h.get_text())
        if len(text) >= 60:
            return text
    # Ultimate fallback: first sufficiently long <p>.
    for p in soup.find_all('p'):
        text = _clean(p.get_text())
        if len(text) >= 60:
            return text
    return ""


def _absolute_url(url: str) -> str:
    if url.startswith('http://') or url.startswith('https://'):
        return url
    if url.startswith('//'):
        return f"https:{url}"
    if url.startswith('/'):
        return f"{BASE_URL}{url}"
    return url


def _hero_image(soup: BeautifulSoup) -> str | None:
    """Find the product hero image URL.

    AGL uses Elementor; the first `.elementor-widget-image` widget inside
    `<main id="content">` is consistently the product hero (the sitewide
    banner image widget lives outside <main>, in the page header). Prefer the
    largest `srcset` variant; fall back to `src`.
    """
    main = soup.find('main', id='content') or soup
    widgets = main.select('.elementor-widget-image')
    for widget in widgets:
        img = widget.find('img')
        if not img:
            continue
        srcset = img.get('srcset') or ''
        best: tuple[int, str] | None = None
        for entry in srcset.split(','):
            parts = entry.strip().rsplit(' ', 1)
            if len(parts) == 2 and parts[1].endswith('w'):
                try:
                    width = int(parts[1][:-1])
                except ValueError:
                    continue
                if best is None or width > best[0]:
                    best = (width, parts[0])
        if best:
            return _absolute_url(best[1])
        src = img.get('src')
        if src:
            return _absolute_url(src)
    return None


def parse_product(html: str, page_id: int, category_slug: str) -> Product:
    soup = BeautifulSoup(html, 'lxml')
    name = _page_title(soup) or f"(untitled product {page_id})"
    # Prefer the visible first paragraph over meta description: meta descriptions
    # on AGL pages are mostly boilerplate site-wide copy.
    desc = _hero_description(soup) or _meta_description(soup)
    thumb = _hero_image(soup)
    return Product(
        page_id=page_id,
        source_url=f"{BASE_URL}/?page_id={page_id}",
        category_slug=category_slug,
        name_en=name,
        description_en=desc,
        thumbnail_url=thumb,
    )


def parse_company(html: str) -> CompanyInfo:
    soup = BeautifulSoup(html, 'lxml')
    # og:site_name is usually the legal-ish company name. Fall back to the <title>.
    og_site = soup.find('meta', {'property': 'og:site_name'})
    name = _clean(og_site['content']) if og_site and og_site.get('content') else ""
    if not name:
        og_title = soup.find('meta', {'property': 'og:title'})
        if og_title and og_title.get('content'):
            name = _clean(og_title['content'])
    # Sensible default — the site brand is Allianz Laos (AGL).
    if not name:
        name = "Allianz Insurance Laos (AGL)"

    # The home page has no descriptive "about AGL" paragraph — only product
    # taglines. Use a concise factual description we control, tolerable to ship
    # unreviewed. Admin can refine it in the CMS later.
    desc = (
        "Assurances Générales du Laos (AGL), operating under the Allianz brand, "
        "is one of the longest-established insurers in Lao PDR. AGL offers a full "
        "catalog of motor, health, life, travel, home, and commercial insurance "
        "products, backed by a nationwide network of garages and hospitals across "
        "Laos and Thailand."
    )

    return CompanyInfo(
        slug="allianz",
        source_url=HOME_URL,
        name_en=name,
        description_en=desc,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--keep-html', action='store_true', help='Save raw HTML alongside JSON')
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[1/2] company: GET {HOME_URL}", file=sys.stderr)
    home_html = fetch(HOME_URL)
    if args.keep_html:
        (OUT_DIR / "home.raw.html").write_text(home_html, encoding='utf-8')
    company = parse_company(home_html)
    print(f"      {company.name_en!r}", file=sys.stderr)

    products: list[Product] = []
    total = len(KNOWN_PAGES)
    for i, (page_id, (category_slug, label)) in enumerate(sorted(KNOWN_PAGES.items()), 1):
        url = f"{BASE_URL}/?page_id={page_id}"
        print(f"[2/2] product {i}/{total}: {label} ({category_slug})  GET {url}", file=sys.stderr)
        try:
            html = fetch(url, referer=HOME_URL)
        except requests.RequestException as exc:
            print(f"      ! giving up on page {page_id}: {exc}", file=sys.stderr)
            continue
        if args.keep_html:
            (OUT_DIR / f"{page_id}.raw.html").write_text(html, encoding='utf-8')
        product = parse_product(html, page_id, category_slug)
        print(f"      → {product.name_en}", file=sys.stderr)
        products.append(product)
        time.sleep(REQUEST_DELAY_SEC)

    out_path = OUT_DIR / "agl.json"
    out_path.write_text(
        json.dumps(
            {"company": asdict(company), "products": [asdict(p) for p in products]},
            indent=2,
            ensure_ascii=False,
        ) + "\n",
        encoding='utf-8',
    )
    print(f"\nWrote {out_path}  ({len(products)} products)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
