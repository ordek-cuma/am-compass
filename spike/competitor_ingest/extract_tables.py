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


def _obs(cid, key, value, member, period, now, quote, unit="USD",
         note="10-K MD&A breakdown table (HTML table parse)."):
    return MetricObservation(
        competitor_id=cid, metric_key=key, value=float(value), unit=unit,
        currency="USD" if unit == "USD" else None,
        period_type="FY", period_end=period, member=member, basis="reported",
        definition_note=note, source_doc="10-K", source_url="", source_section=quote,
        confidence=0.92, extracted_by="table-parse", extracted_at=now)


# Client channel ← client-type rollforward subtotal row (ending AuM = last big number).
_CHANNEL_ROWS = [
    ("Retail", "retail subtotal"), ("ETFs", "etfs subtotal"),
    ("Institutional", "institutional subtotal"), ("Cash management", "cash management"),
]


def _client_type(cid, tbls, now, period="2025-12-31") -> list[MetricObservation]:
    for t in tables.find(tbls, ["Retail subtotal", "ETFs subtotal", "Institutional subtotal", "Cash management"]):
        flat = " ".join(c for r in t for c in r).lower()
        if "active subtotal" not in flat:
            continue

        def ending(label):
            for row in t:
                if (row[0] or "").strip().lower() == label:
                    vals = _bignums(row, floor=50000)
                    return vals[-1] if vals else None
            return None

        out, members = [], {}
        for member, lab in _CHANNEL_ROWS:
            v = ending(lab)
            if v:
                members[member] = v
                out.append(_obs(cid, "aum_by_channel", v * 1e6, member, period, now,
                                f"10-K client-type rollforward: {member} ${v:,.0f}M ending AuM (FY2025)"))
        etf, idx, tot = members.get("ETFs"), ending("index"), sum(members.values())
        if etf and idx and tot:  # passive = ETFs + institutional index
            out.append(_obs(cid, "pct_passive", round(100 * (etf + idx) / tot, 1), "", period, now,
                            f"10-K: (ETFs ${etf:,.0f}M + institutional index ${idx:,.0f}M) ÷ total AuM",
                            unit="pct", note="Index + ETF AuM ÷ total AuM (from 10-K client-type table)."))
        return out
    return []


# Revenue lines ← consolidated income-statement row prefix (3 FY columns: 2025/2024/2023).
_REV_ROWS = [
    ("mgmt_fee_revenue", "total investment advisory, administration fees and securities lending"),
    ("performance_fees", "investment advisory performance fees"),
    ("tech_revenue", "technology services"),
    ("dist_fee_revenue", "distribution fees"),
    ("advisory_other_revenue", "advisory and other revenue"),
]
_IS_PERIODS = ["2025-12-31", "2024-12-31", "2023-12-31"]


def _income_statement(cid, tbls, now) -> list[MetricObservation]:
    cand = find_is(tbls)
    if not cand:
        return []
    t, out = cand, []
    for key, pat in _REV_ROWS:
        for row in t:
            lab = (row[0] or "").strip().lower()
            if lab.startswith(pat):
                vals = _bignums(row, floor=10)
                for i, period in enumerate(_IS_PERIODS):
                    if i < len(vals):
                        out.append(_obs(cid, key, vals[i] * 1e6, "", period, now,
                                        f"10-K income statement: {row[0]} ${vals[i]:,.0f}M ({period[:4]})",
                                        note="10-K consolidated statements of income (HTML table parse)."))
                break
    return out


def find_is(tbls):
    for t in tables.find(tbls, ["Technology services", "Distribution fees", "Total revenue", "Total expense"]):
        return t
    return None


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

    # Revenue lines (Business Mix · Revenue) — from the consolidated income statement, 3-year.
    out += _income_statement(cid, tbls, now)
    # Client channel + active/passive split.
    out += _client_type(cid, tbls, now)
    # Countries of operation (prose: "… in more than 30 countries …").
    import re as _re
    m = _re.search(r"in (?:more than |over )?(\d{2,3}) countries", _re.sub(r"<[^>]+>", " ", html))
    if m:
        out.append(_obs(cid, "num_countries", int(m.group(1)), "", "2025-12-31", now,
                        f"10-K: “in more than {m.group(1)} countries”", unit="count",
                        note="10-K business section."))

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
