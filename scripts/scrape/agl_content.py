"""Extract the main body content of an AGL product page.

Called from agl.py during the main scrape pass. Also runnable standalone
against a cached `out/<page_id>.raw.html` for quick regression checks.

Returns a dict with `html`, `text`, `inline_images`, and `pdf_links` that the
seed script (`scripts/seed-agl-content.ts`) consumes to populate
`InsuranceContent` rows.

Standalone:
    python3 agl_content.py              # page_id=694 by default
    python3 agl_content.py 700          # any cached page id
"""

from __future__ import annotations

import copy
import re
import sys
from pathlib import Path
from urllib.parse import urlparse, unquote

from bs4 import BeautifulSoup, Tag

from agl_known_pages import KNOWN_PAGES

OUT_DIR = Path(__file__).parent / "out"

# Tags we keep in the output. Everything else is either unwrapped (children
# promoted) or dropped. Small on purpose — TipTap re-materialises anything
# here as ProseMirror nodes.
ALLOWED_TAGS = {"h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em",
                "b", "i", "a", "br", "img", "hr"}
BLOCK_TAGS = ALLOWED_TAGS - {"strong", "em", "b", "i", "a", "br"}

# Per-tag attribute whitelist. Anything not listed gets stripped.
ALLOWED_ATTRS: dict[str, set[str]] = {
    "a":   {"href"},
    "img": {"src", "alt"},
}

# Invisible formatting chars that appear in AGL copy (zero-width space, BOM,
# word-joiner). Strip everywhere.
_INVISIBLES = re.compile(r"[​-‏‪-‮⁠﻿]")


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", _INVISIBLES.sub("", text or "")).strip()


def _normalise_title(t: str) -> str:
    """Normalise a product name for equality comparison: lowercase, strip
    'insurance' suffix, collapse whitespace. Used to detect the duplicate
    product-title heading in the body."""
    t = _clean(t).lower()
    t = re.sub(r"\s+insurance\b", "", t)
    return t


def _is_related_product_section(section: Tag, current_page_id: int) -> bool:
    """True if this section links to a different product's page_id.

    AGL's product pages end with 2-3 cross-sell cards linking to sibling
    products. Stop at the first such section.
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
    footer_markers = (
        "Allianz Insurance Laos is ready by your side",
        "Head Office",
        "Lane Xang Avenue",
        "©Assurances General Laos",
    )
    return any(m in text for m in footer_markers)


def _prune_to_allowed(root: Tag) -> None:
    """Convert elementor icon lists, drop chrome/scripts/svgs, strip unknown
    tags/attrs. Operates in-place."""
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

    for tag_name in ("script", "style", "noscript", "nav", "aside", "footer",
                     "header", "svg", "iframe", "form", "button"):
        for t in root.find_all(tag_name):
            t.decompose()

    for tag in list(root.find_all(True))[::-1]:
        if tag.name not in ALLOWED_TAGS:
            tag.unwrap()
            continue
        allowed = ALLOWED_ATTRS.get(tag.name, set())
        for attr in list(tag.attrs.keys()):
            if attr not in allowed:
                del tag.attrs[attr]


def _rescue_icon_links(root: Tag) -> None:
    """AGL renders download buttons as `<a href="...pdf">` containing only an
    icon. After svg/icon stripping the link is empty; give it the filename as
    text and wrap bare anchors in <p> so block extraction picks them up.
    """
    factory = BeautifulSoup("", "lxml")
    for a in list(root.find_all("a", href=True)):
        if not _clean(a.get_text()):
            href = a["href"]
            name = unquote(urlparse(href).path.rsplit("/", 1)[-1]) or href
            a.string = name
        parent = a.parent
        if parent is not None and parent.name in {"p", "li", "h1", "h2", "h3", "h4"}:
            continue
        wrapper = factory.new_tag("p")
        a.replace_with(wrapper)
        wrapper.append(a)


def _collapse_empty(root: Tag) -> None:
    for tag in list(root.find_all(["p", "li", "h1", "h2", "h3", "h4"])):
        if not _clean(tag.get_text()) and not tag.find("img"):
            tag.decompose()


def _strip_invisibles_everywhere(root: Tag) -> None:
    """Polish fix #5 — strip U+200B and friends from all text nodes."""
    for text_node in list(root.find_all(string=True)):
        cleaned = _INVISIBLES.sub("", str(text_node))
        if cleaned != str(text_node):
            text_node.replace_with(cleaned)


def _demote_lead_headings(flat: Tag) -> None:
    """Polish fix #1 — demote sentence-like or stacked-lead <h2>/<h3>/<h4>
    nodes to <p>. AGL's Elementor pages use heading widgets for body taglines
    that are really just prose copy, not section headers.

    Rules (OR):
      (a) Heading followed immediately by another heading (stacked taglines).
      (b) Sentence-like text: >= 80 chars and ending in `.`, `!`, or `?`.
    """
    factory = BeautifulSoup("", "lxml")
    children = [c for c in flat.children if isinstance(c, Tag)]
    for i, node in enumerate(children):
        if node.name not in {"h2", "h3", "h4"}:
            continue
        text = _clean(node.get_text())
        # Rule (b): long sentence-like copy.
        sentence_like = len(text) >= 80 and text.rstrip().endswith((".", "!", "?"))
        # Rule (a): next block sibling is another heading.
        nxt = None
        for sib in children[i + 1:]:
            if sib.name in BLOCK_TAGS:
                nxt = sib
                break
        stacked = nxt is not None and nxt.name in {"h2", "h3", "h4"}
        if sentence_like or stacked:
            new_p = factory.new_tag("p")
            new_p.string = text
            node.replace_with(new_p)


def _drop_duplicate_title(flat: Tag, name_en: str) -> None:
    """Polish fix #2 — drop the leading <h1>/<h2> if it matches the product
    name_en (case- and 'Insurance'-suffix-insensitive). The title already
    lives in InsuranceMetadata; repeating it in the body is noise."""
    target = _normalise_title(name_en)
    for child in flat.children:
        if not isinstance(child, Tag):
            continue
        if child.name in {"h1", "h2"}:
            if _normalise_title(child.get_text()) == target:
                child.decompose()
            return
        if child.name in BLOCK_TAGS:
            return


def extract_content(
    html: str,
    page_id: int,
    name_en: str = "",
    thumbnail_url: str | None = None,
) -> dict:
    """Extract the main body content of an AGL product page.

    Returns a dict shaped as:
        {
          "html":           "<h2>…</h2><ul>…</ul>…",
          "text":           "…",
          "inline_images":  ["https://www.agl.com.la/wp-content/…", …],
          "pdf_links":      [{"href": "https://…", "text": "…"}, …],
        }
    """
    soup = BeautifulSoup(html, "lxml")
    main = soup.find("main", id="content") or soup

    # 1. Collect product-body sections only (stop at cross-sells and footer).
    kept_sections: list[Tag] = []
    for sec in main.select(".e-con"):
        if _looks_like_footer(sec) or _is_related_product_section(sec, page_id):
            break
        kept_sections.append(sec)

    # 2. Build a disposable container.
    container = BeautifulSoup("<div></div>", "lxml").div
    assert container is not None
    for sec in kept_sections:
        container.append(copy.copy(sec))

    # 3. Normalise: chrome stripping, whitelist tags/attrs, rescue icon-only links.
    _prune_to_allowed(container)
    _rescue_icon_links(container)
    _strip_invisibles_everywhere(container)

    # 4. Flatten: take top-level semantic blocks in document order. Dedupe
    #    <h*>/<p>/<li>/<ul>/<ol> by normalised text (Elementor renders mobile
    #    + desktop duplicates). Anchors are wrapped in <p> so dedupe applies
    #    by link text (usually the filename) — same URL twice collapses.
    flat = BeautifulSoup("<div></div>", "lxml").div
    assert flat is not None
    seen_text: set[str] = set()
    seen_image_urls: set[str] = set()
    thumb = thumbnail_url or ""
    for el in container.find_all(BLOCK_TAGS):
        # Top-level blocks only.
        if any(
            p is not None and p.name in BLOCK_TAGS
            for p in el.parents
            if p is not flat and p is not container
        ):
            continue
        if el.name == "img":
            src = el.get("src") or ""
            # Polish fix #3 — dedupe by URL and drop hero-thumbnail matches.
            if not src or src in seen_image_urls or src == thumb:
                continue
            seen_image_urls.add(src)
            flat.append(el.extract())
            continue
        text = _clean(el.get_text())
        if not text:
            continue
        key = f"{el.name}:{text.lower()}"
        if key in seen_text:
            continue
        seen_text.add(key)
        flat.append(el.extract())

    _collapse_empty(flat)
    # Drop duplicate product-title heading first — while it's still a heading.
    if name_en:
        _drop_duplicate_title(flat, name_en)
    _demote_lead_headings(flat)
    _collapse_empty(flat)  # again, in case drops created empties

    # 5. Outputs.
    raw_html = flat.decode_contents()
    pretty_html = re.sub(r">\s*<", ">\n<", raw_html).strip()

    plain_lines: list[str] = []
    for el in flat.find_all(True):
        if el.name == "img":
            plain_lines.append(f"[image: {el.get('alt') or el.get('src', '')}]")
        elif el.name in {"h1", "h2", "h3", "h4"}:
            plain_lines.append("")
            plain_lines.append(f"# {_clean(el.get_text())}")
            plain_lines.append("")
        elif el.name == "li":
            plain_lines.append(f"  - {_clean(el.get_text())}")
        elif el.name == "p":
            plain_lines.append(_clean(el.get_text()))
    plain_text = "\n".join(l for l in plain_lines).strip() + "\n"

    inline_images = [img.get("src") for img in flat.find_all("img") if img.get("src")]

    pdf_links: list[dict] = []
    seen_hrefs: set[str] = set()
    for a in flat.find_all("a", href=True):
        href = a["href"]
        if not href.lower().endswith((".pdf", ".doc", ".docx")):
            continue
        if href in seen_hrefs:
            continue
        seen_hrefs.add(href)
        pdf_links.append({"href": href, "text": _clean(a.get_text()) or href})

    return {
        "html": pretty_html,
        "text": plain_text,
        "inline_images": inline_images,
        "pdf_links": pdf_links,
    }


def main() -> int:
    page_id = int(sys.argv[1]) if len(sys.argv) > 1 else 694
    raw_path = OUT_DIR / f"{page_id}.raw.html"
    if not raw_path.exists():
        print(f"{raw_path} not found — run `./venv/bin/python3 agl.py --keep-html` first.",
              file=sys.stderr)
        return 1

    html = raw_path.read_text(encoding="utf-8")

    # Standalone mode: best-effort product name from <title> for duplicate-title
    # dedupe. agl.py passes name_en explicitly.
    soup = BeautifulSoup(html, "lxml")
    title_el = soup.title
    guessed_name = _clean(title_el.string) if title_el and title_el.string else ""
    guessed_name = re.sub(r"\s*[–-]\s*AGL.*$", "", guessed_name)

    result = extract_content(html, page_id, name_en=guessed_name)

    html_out = OUT_DIR / f"{page_id}.content.html"
    text_out = OUT_DIR / f"{page_id}.content.txt"
    html_out.write_text(
        "<!doctype html>\n<html><body>\n" + result["html"] + "\n</body></html>\n",
        encoding="utf-8",
    )
    text_out.write_text(result["text"], encoding="utf-8")

    print(f"page_id={page_id}  (name_en guess: {guessed_name!r})")
    print(f"  wrote {html_out}  ({html_out.stat().st_size} bytes)")
    print(f"  wrote {text_out}  ({text_out.stat().st_size} bytes)")
    print(f"  inline images: {len(result['inline_images'])}")
    for u in result["inline_images"][:8]:
        print(f"    {u}")
    print(f"  pdf links: {len(result['pdf_links'])}")
    for p in result["pdf_links"][:8]:
        print(f"    {p['text'][:40]:40s} -> {p['href']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
