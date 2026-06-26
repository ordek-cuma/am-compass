"""Goldman Sachs (Goldman Sachs) — Competitor Data Scraper (browser-download).

GS's IR PDFs sit behind Akamai Bot Manager: a plain fetch gets a 572-byte challenge page,
and even the browser's request context is blocked. But the documents download fine through a
genuine in-session browser navigation (load a GS page → the same "Download Report" / direct
navigation a real user does). So this scraper runs in browser_download mode.

The catalog comes from the public feed goldmansachs.com/feeds/financials.json (not blocked).
We take Annual Reports + Form 10-Ks + Proxy Statements, last 5 years, resolve each to its
final PDF URL (direct .pdf path, or an annual-report article page's /multimedia/<slug>.pdf),
and the worker downloads each via the warmed browser session.
"""
from __future__ import annotations
import json
import re

from .. import web
from .base import CompetitorDataScraper

_FEED = "https://www.goldmansachs.com/feeds/financials.json"
_HOST = "https://www.goldmansachs.com"
_WARMUP = "https://www.goldmansachs.com/investor-relations/financials/annual-reports"
_YEAR_MIN = 2021


def _title(it: dict) -> str:
    t = it.get("title")
    return " ".join(map(str, t)) if isinstance(t, list) else (t or "")


def _year(it: dict) -> int | None:
    m = re.search(r"\b(20\d\d)\b", _title(it))
    return int(m.group(1)) if m else None


def resolve() -> list[dict]:
    """Annual Reports + 10-Ks + Proxy Statements (last 5y) → [{url, label, group}]."""
    try:
        data, _ = web.fetch(_FEED)
        feed = json.loads(data)
    except Exception as e:
        print(f"  ! goldman feed fetch failed: {e}")
        return []
    out, seen = [], set()
    for it in feed:
        t, path = _title(it), it.get("path")
        if not path:
            continue
        low = path.lower()
        if "xbrl" in low or low.endswith(".zip"):   # XBRL data bundles — skip
            continue
        if re.search(r"annual report", t, re.I):
            group = "Annual"
        elif re.search(r"\b10-?k\b", t, re.I):
            group = "10-K"
        elif re.search(r"proxy statement", t, re.I):
            group = "Proxy"
        else:
            continue
        y = _year(it)
        if not y or y < _YEAR_MIN:
            continue
        if low.endswith(".pdf"):
            url = _HOST + path
        else:  # article page (annual reports) → the report PDF lives under /multimedia/<slug>.pdf
            url = f"{_HOST}{path.rstrip('/')}/multimedia/{path.rstrip('/').split('/')[-1]}.pdf"
        if url in seen:
            continue
        seen.add(url)
        out.append({"url": url, "label": t[:90], "group": group})
    return out


SCRAPER = CompetitorDataScraper(
    code="Goldman Sachs",
    name="Goldman Sachs",
    notes="Akamai-protected PDFs → browser_download (in-session navigation). Catalog from "
          "financials.json feed; Annual + 10-K + Proxy, last 5y.",
    browser_download=True,
    warmup=_WARMUP,
    resolve=resolve,
)
