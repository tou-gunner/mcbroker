"""Hand-curated mapping of AGL (agl.com.la) product page_id → local category slug.

Category slugs here must match the canonical slugs the app renders icons for in
app/utils/index.ts: life, health, accident, travel, home, car, business.

Source: the AGL main-menu / product index discovered during the initial WebFetch
of https://www.agl.com.la/ on 2026-04-23. Keyed by page_id so the scraper can
visit each product page directly and so category assignment is stable across
re-scrapes (page titles may drift; IDs are WordPress-permanent).
"""

# page_id -> (category_slug, short_label) -- short_label is only for logs/debug.
KNOWN_PAGES: dict[int, tuple[str, str]] = {
    # Motor
    694: ("car", "Smart Flex Motor"),
    696: ("car", "Worry Free Driving Motor"),
    698: ("car", "Third Party Liability Motor"),
    # Health & Life
    700: ("health", "Health Insurance"),
    702: ("accident", "Personal Accident"),
    704: ("business", "Workmen's Compensation"),
    706: ("life", "Life Protection"),
    708: ("life", "Term Life"),
    710: ("travel", "Travel"),
    # Property & Casualty
    712: ("home", "Home Insurance"),
    714: ("business", "Small Commercial Business"),
    716: ("business", "Property All Risks"),
    718: ("business", "Public Liability"),
    720: ("business", "Engineering & Machinery"),
    722: ("business", "Money"),
    724: ("business", "Transport"),
}
