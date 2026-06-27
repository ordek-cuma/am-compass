"""Breakdown extraction from a 10-K's MD&A tables (HTML table parse, not text-grep).

Pulls the multi-dimensional AuM cuts that aren't in XBRL — by asset class and by client region —
straight from the firm's disclosure tables, with the cell value cited. Gated per-firm (table
layouts differ); BlackRock first. Each member observation carries member + the verbatim figure.
"""
from __future__ import annotations

from . import edgar, tables
from .schema import MetricObservation

# Firms whose 10-K MD&A uses the BlackRock-style "AUM by asset class" + region rollforward.
TABLE_FIRMS = {"BL"}

# Canonical member ← row-label prefix (BlackRock "AUM by asset class" lines).
_ASSET_ROWS = [
    ("Equity", "equity"),
    ("Fixed income", "fixed income"),
    ("Multi-asset", "multi-asset"),
    ("Alternatives", "alternatives"),
    ("Cash management", "cash management"),
]
_REGION_ROWS = [("Americas", "americas"), ("EMEA", "emea"), ("Asia-Pacific", "asia-pacific")]


def _obs(cid, key, value, member, period, now, quote):
    return MetricObservation(
        competitor_id=cid, metric_key=key, value=float(value), unit="USD", currency="USD",
        period_type="FY", period_end=period, member=member, basis="reported",
        definition_note="10-K MD&A breakdown table (HTML table parse).",
        source_doc="10-K", source_url="", source_section=quote,
        confidence=0.9, extracted_by="table-parse", extracted_at=now)


def _bignums(row, floor=1000):
    return [n for n in (tables.num(c) for c in row) if n is not None and abs(n) >= floor]


def extract(cid: str, cik: str, now: str, period: str = "2025-12-31") -> list[MetricObservation]:
    if cid not in TABLE_FIRMS:
        return []
    try:
        html = edgar.get_text(edgar.latest_annual_filing(cik)["url"])
    except Exception as e:
        print(f"  ! {cid} table fetch: {e}")
        return []
    tbls = tables.tables(html)
    out: list[MetricObservation] = []

    # AuM by asset class — the point-in-time table (December 31 columns; NOT a rollforward).
    for t in tables.find(tbls, ["Equity", "Fixed income", "Multi-asset", "Cash management", "Total"]):
        flat = " ".join(c for r in t for c in r).lower()
        if "net inflows" in flat or "market change" in flat or "marketchange" in flat:
            continue
        got = []
        for member, pat in _ASSET_ROWS:
            for row in t:
                lab = (row[0] or "").strip().lower()
                if lab.startswith(pat) and "total" not in lab and "long-term" not in lab:
                    vals = _bignums(row)
                    if vals:
                        got.append(_obs(cid, "aum_by_asset_class", vals[0] * 1e6, member, period, now,
                                        f"10-K “AUM by asset class”: {member} ${vals[0]:,.0f}M (FY2025)"))
                    break
        if len(got) >= 4:
            out += got
            break

    # AuM by client region — the rollforward (ending AuM = last big number in each row).
    for t in tables.find(tbls, ["Americas", "EMEA", "Asia-Pacific", "Total"]):
        if not any((r[0] or "").strip().lower().startswith("americas") and _bignums(r) for r in t):
            continue
        got = []
        for member, pat in _REGION_ROWS:
            for row in t:
                if (row[0] or "").strip().lower().startswith(pat):
                    vals = _bignums(row, floor=100000)
                    if vals:
                        got.append(_obs(cid, "aum_by_region", vals[-1] * 1e6, member, period, now,
                                        f"10-K region rollforward: {member} ${vals[-1]:,.0f}M ending AuM (FY2025)"))
                    break
        if len(got) >= 2:
            out += got
            break

    return out
