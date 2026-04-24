"""Proof-of-concept: extract the main body content of a single AGL product page.

Throwaway. Takes a cached raw HTML file (scripts/scrape/out/<page_id>.raw.html —
produced by `agl.py --keep-html`) and emits:

  out/<page_id>.content.html   — cleaned, whitelist-tag HTML suitable for TipTap
  out/<page_id>.content.txt    — plain text version (paragraphs preserved)

Goal of the POC: let a human eyeball the output for one product (Smart Flex
Motor, page_id=694 by default) to decide whether this approach is worth
productionising across all 16 products.

Run:
    python3 agl_content_poc.py              # defaults to page_id=694
    python3 agl_content_poc.py 700          # any cached page id
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Tag, NavigableString

from agl_known_pages import KNOWN_PAGES

OUT_DIR = Path(__file__).parent / "out"

# Tags we keep in the output. Everything else is either unwrapped (children
# promoted) or dropped. Keep the set small — TipTap imports HTML and will
# happily re-materialise whatever's here as ProseMirror nodes.
ALLOWED_TAGS = {"h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em",
                "b", "i", "a", "br", "img", "hr"}

# Per-tag attribute whitelist. Anything not listed gets stripped.
ALLOWED_ATTRS: dict[str, set[str]] = {
    "a":   {"href"},
    "img": {"src", "alt"},
}


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _is_related_product_section(section: Tag, current_page_id: int) -> bool:
    """True if this section links to a different product's page_id.

    AGL's product pages end with 2-3 cross-sell cards linking to sibling
    products. Those are not body content — they're navigation. Stop at the
    first such section.
    """
    for a in section.find_all("a", href=True):
        m = re.search(r"[?&]page_id=(\d+)", a["href"])
        if not m:
            continue
        pid = int(m.group(1))
        if pid != current_page_id and pid in KNOWN_PAGES:
            return True
    return False


def _looks_like_footer(section: Tag) -> bool:
    """Drop the sitewide footer (appears on every product page)."""
    text = _clean(section.get_text())
    FOOTER_MARKERS = (
        "Allianz Insurance Laos is ready by your side",
        "Head Office",
        "Lane Xang Avenue",
        "©Assurances General Laos",
    )
    return any(m in text for m in FOOTER_MARKERS)


def _prune_to_allowed(root: Tag) -> None:
    """Walk the tree bottom-up. Drop disallowed tags (promote their children
    when they carry meaningful text; otherwise remove). Strip attributes down
    to the per-tag whitelist.
    """
    # Convert elementor icon lists to plain <ul>/<li> so the whitelist picks
    # them up. Each `.elementor-icon-list-item` becomes an <li>.
    factory = BeautifulSoup("", "lxml")
    for node in root.select(".elementor-icon-list-items"):
        new_ul = factory.new_tag("ul")
        for item in node.select(".elementor-icon-list-item"):
            text_el = item.select_one(".elementor-icon-list-text")
            text = _clean(text_el.get_text() if text_el else item.get_text())
            if text:
                li = factory.new_tag("li")
                li.string = text
                new_ul.append(li)
        if new_ul.find("li"):
            node.replace_with(new_ul)
        else:
            node.decompose()

    # Drop script/style/nav/aside/footer/header first, scoped to root.
    for tag_name in ("script", "style", "noscript", "nav", "aside", "footer",
                     "header", "svg", "iframe", "form", "button"):
        for t in root.find_all(tag_name):
            t.decompose()

    # Walk every remaining tag bottom-up.
    for tag in list(root.find_all(True))[::-1]:
        if tag.name not in ALLOWED_TAGS:
            # Replace with its children so text survives.
            tag.unwrap()
            continue
        # Strip attributes.
        allowed = ALLOWED_ATTRS.get(tag.name, set())
        for attr in list(tag.attrs.keys()):
            if attr not in allowed:
                del tag.attrs[attr]


def _dedupe_consecutive(nodes: list[Tag]) -> list[Tag]:
    """Elementor pages render the same heading twice (mobile + desktop
    variants); dedupe by normalised text."""
    out: list[Tag] = []
    last_text: str | None = None
    for n in nodes:
        text = _clean(n.get_text())
        if not text:
            continue
        if text == last_text:
            continue
        out.append(n)
        last_text = text
    return out


def _rescue_icon_links(root: Tag) -> None:
    """AGL renders download buttons as `<a href="...pdf">` with only an icon
    inside (no text). After we strip the icon tag/SVG, the link becomes empty
    and later gets dropped. Rescue these by giving them the filename as text,
    and wrap them in a <p> so the block-level extraction pass picks them up.
    """
    from urllib.parse import urlparse, unquote
    factory = BeautifulSoup("", "lxml")
    for a in list(root.find_all("a", href=True)):
        # Fill empty anchors with a text fallback derived from the filename.
        if not _clean(a.get_text()):
            href = a["href"]
            name = unquote(urlparse(href).path.rsplit("/", 1)[-1]) or href
            a.string = name
        # If the anchor isn't already inside a block (p/li/h*), wrap it.
        parent = a.parent
        if parent is not None and parent.name in {"p", "li", "h1", "h2", "h3", "h4"}:
            continue
        wrapper = factory.new_tag("p")
        a.replace_with(wrapper)
        wrapper.append(a)


def _collapse_empty(root: Tag) -> None:
    """Drop now-empty paragraphs, headings, and list items."""
    for tag in list(root.find_all(["p", "li", "h1", "h2", "h3", "h4"])):
        if not _clean(tag.get_text()) and not tag.find("img"):
            tag.decompose()


def extract_content(html: str, page_id: int) -> tuple[str, str, list[str]]:
    """Returns (clean_html, plain_text, image_urls)."""
    soup = BeautifulSoup(html, "lxml")
    main = soup.find("main", id="content") or soup

    # 1. Collect top-level sections (`.e-con`) up to (but not including) the
    #    first cross-sell or footer section.
    kept_sections: list[Tag] = []
    for sec in main.select(".e-con"):
        if _looks_like_footer(sec):
            break
        if _is_related_product_section(sec, page_id):
            break
        kept_sections.append(sec)

    # 2. Build a synthetic container holding just those sections, so we prune
    #    without touching the rest of the page.
    container = BeautifulSoup("<div></div>", "lxml").div
    assert container is not None
    for sec in kept_sections:
        # Copy, don't move: keeps the original tree intact for later diagnostics.
        import copy
        container.append(copy.copy(sec))

    # 3. Strip disallowed tags/attrs, flatten elementor list widgets, drop chrome.
    _prune_to_allowed(container)
    _rescue_icon_links(container)

    # 4. Flatten: take only direct semantic descendants, in document order.
    flat = BeautifulSoup("<div></div>", "lxml").div
    assert flat is not None
    seen_text: set[str] = set()
    for el in container.find_all(ALLOWED_TAGS - {"strong", "em", "b", "i", "a", "br"}):
        # Skip nested occurrences — we only want top-level blocks once.
        if any(p is not None and p.name in ALLOWED_TAGS - {"strong", "em", "b", "i", "a", "br"} for p in el.parents if p is not flat and p is not container):
            continue
        text = _clean(el.get_text())
        if el.name == "img":
            # Keep every image instance.
            flat.append(el.extract())
            continue
        if not text:
            continue
        # Dedupe by text (elementor duplicates for mobile/desktop variants).
        key = f"{el.name}:{text.lower()}"
        if key in seen_text:
            continue
        seen_text.add(key)
        flat.append(el.extract())

    _collapse_empty(flat)

    # 5. Build outputs.
    html_out = flat.decode_contents()
    # Pretty-print: one tag per line so the review file is diff-friendly.
    pretty = re.sub(r">\s*<", ">\n<", html_out).strip()

    plain_lines: list[str] = []
    for el in flat.find_all(True):
        if el.name == "img":
            plain_lines.append(f"[image: {el.get('alt') or el.get('src', '')}]")
            continue
        if el.name in {"h1", "h2", "h3", "h4"}:
            plain_lines.append("")
            plain_lines.append(f"# {_clean(el.get_text())}")
            plain_lines.append("")
        elif el.name == "li":
            plain_lines.append(f"  - {_clean(el.get_text())}")
        elif el.name == "p":
            plain_lines.append(_clean(el.get_text()))
        elif el.name in {"ul", "ol"}:
            # li's handled above
            pass
    plain_text = "\n".join(l for l in plain_lines if l is not None).strip() + "\n"

    image_urls: list[str] = []
    for img in flat.find_all("img"):
        src = img.get("src")
        if src:
            image_urls.append(src)

    return pretty, plain_text, image_urls


def main() -> int:
    page_id = int(sys.argv[1]) if len(sys.argv) > 1 else 694
    raw_path = OUT_DIR / f"{page_id}.raw.html"
    if not raw_path.exists():
        print(f"{raw_path} not found — run `./venv/bin/python3 agl.py --keep-html` first.",
              file=sys.stderr)
        return 1

    html = raw_path.read_text(encoding="utf-8")
    clean_html, plain_text, images = extract_content(html, page_id)

    html_out = OUT_DIR / f"{page_id}.content.html"
    text_out = OUT_DIR / f"{page_id}.content.txt"
    html_out.write_text(
        "<!doctype html>\n<html><body>\n" + clean_html + "\n</body></html>\n",
        encoding="utf-8",
    )
    text_out.write_text(plain_text, encoding="utf-8")

    print(f"page_id={page_id}")
    print(f"  wrote {html_out}  ({html_out.stat().st_size} bytes)")
    print(f"  wrote {text_out}  ({text_out.stat().st_size} bytes)")
    print(f"  inline images: {len(images)}")
    for u in images[:8]:
        print(f"    {u}")
    if len(images) > 8:
        print(f"    ... and {len(images) - 8} more")
    return 0


if __name__ == "__main__":
    sys.exit(main())
