"""Parse per-product documents.json into a doc inventory + derive document-based facts.

Doc categories seen: fact-sheet, kiid, annual-report, prospectus.
"""
from __future__ import annotations
import json
import re
import datetime as dt
from pathlib import Path

_MON = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6, "jul": 7,
        "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}


def _date_from_text(s: str):
    """e.g. '...annual-report-de-at-de-28-feb-25.pdf' -> 2025-02-28."""
    m = re.search(r"(\d{1,2})[-_ ]([a-z]{3})[a-z]*[-_ ](\d{2,4})", s, re.I)
    if not m:
        return None
    day, mon, yr = int(m.group(1)), m.group(2).lower(), int(m.group(3))
    if mon not in _MON:
        return None
    if yr < 100:
        yr += 2000
    try:
        return dt.date(yr, _MON[mon], day)
    except ValueError:
        return None


def load(product_dir: Path) -> dict:
    f = Path(product_dir) / "documents.json"
    if not f.exists():
        return {}
    try:
        return json.loads(f.read_text(encoding="utf-8", errors="ignore"))
    except json.JSONDecodeError:
        return {}


def summarize(docjson: dict) -> dict:
    docs = docjson.get("documents", [])
    by_cat: dict[str, int] = {}
    ar_dates = []
    for d in docs:
        cat = d.get("category", "other")
        by_cat[cat] = by_cat.get(cat, 0) + 1
        if cat == "annual-report":
            dd = _date_from_text(d.get("url", "") + " " + d.get("label", ""))
            if dd:
                ar_dates.append(dd)
    return {
        "portfolioId": docjson.get("portfolioId"),
        "isin": docjson.get("isin"),
        "fundName": docjson.get("fundName"),
        "doc_count": len(docs),
        "by_category": by_cat,
        "latest_annual_report": max(ar_dates).isoformat() if ar_dates else None,
    }
