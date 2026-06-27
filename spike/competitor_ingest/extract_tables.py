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

# Canonical member ← row-label prefixes (cross-firm; labels are hyphen-normalised before match).
_ASSET_ROWS = [
    ("Equity", ["equity"]),
    ("Fixed income", ["fixed income"]),
    ("Multi-asset", ["multi asset", "balanced", "asset allocation"]),
    ("Money market / cash", ["cash management", "money market", "stable value", "liquidity"]),
    ("Alternatives", ["alternative"]),  # "alternatives", "alternative / private markets"
    ("Real assets / RE", ["real estate", "real assets"]),
]
_REGION_ROWS = [("Americas", "americas"), ("EMEA", "emea"), ("Asia-Pacific", "asia-pacific")]
_REGION_MEMBERS = [
    ("Americas", ["americas", "north america"]),
    ("EMEA", ["emea", "europe"]),
    ("Asia-Pacific", ["asia pacific", "apac", "asia"]),
]


def _breakdown(cid, tbls, key, member_rows, anchors, now, period, aum_hint, cut_label) -> list[MetricObservation]:
    """Generic, reconciliation-guarded AuM breakdown (asset class, region, …). Hyphen-normalises
    labels, aggregates leaf rows per member, auto-detects scale ($m/$bn), and — across ALL
    candidate tables — records the one that reconciles BEST to the firm's known AuM (≤8%),
    preferring an as-of table over an average/rollforward. A wrong table is rejected, not recorded."""
    if not aum_hint:
        return []
    ref = aum_hint / 1e6
    best = None  # (diff, agg, scale)
    for t in tables.find(tbls, anchors):
        flat = " ".join(c for r in t for c in r).lower()
        if any(x in flat for x in ("net inflows", "market change", "marketchange", "performance", "average", "outperform")):
            continue
        agg: dict[str, float] = {}
        for member, pats in member_rows:
            for row in t:
                lab = (row[0] or "").strip().lower().replace("-", " ")
                if any(p in lab for p in pats) and not any(x in lab for x in ("total", "subtotal", "long term", "% of", "weighted")):
                    vals = _bignums(row, floor=1)
                    if vals:
                        agg[member] = agg.get(member, 0) + vals[0]
        if len(agg) < 2:
            continue
        s = sum(agg.values())
        for scale, sv in ((1e6, s), (1e9, s * 1000)):
            diff = abs(sv - ref) / ref
            if diff < 0.08 and (best is None or diff < best[0]):
                best = (diff, dict(agg), scale)
    if best:
        _, agg, scale = best
        return [_obs(cid, key, v * scale, m, period, now,
                     f"10-K {cut_label}: {m} ${v * scale / 1e9:,.1f}B (reconciled to firm AuM)")
                for m, v in agg.items()]
    return []


def _aum_by_asset_class(cid, tbls, now, period, aum_hint=None) -> list[MetricObservation]:
    return _breakdown(cid, tbls, "aum_by_asset_class", _ASSET_ROWS, ["Equity", "Total"], now, period, aum_hint, "AUM by asset class")


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


import re

_INCOME_TOTALS = ("total revenue", "total revenues", "net revenues", "total net revenues",
                  "net revenue", "total operating revenues")
# metric ← (include-substrings, exclude-substrings), matched within the revenue section in order.
_FEE_ROWS = [
    ("mgmt_fee_revenue", ("investment management fee", "investment advisory", "advisory and administration",
                          "management fees", "advisory fees"), ("performance",)),
    ("performance_fees", ("performance", "incentive", "carried interest"), ()),
    ("dist_fee_revenue", ("distribution",), ("cost", "expense")),
    ("tech_revenue", ("technology",), ()),
]


def _find_income(tbls):
    """Generic consolidated income statement: a table with a total-revenue row, an advisory/
    management-fee row, and year columns."""
    for t in tbls:
        labs = [(r[0] or "").strip().lower() for r in t]
        has_total = any(l in _INCOME_TOTALS for l in labs)
        has_fee = any(("advisor" in l or "management fee" in l) and "performance" not in l for l in labs)
        has_years = any(len([c for c in r if re.fullmatch(r"20[0-3]\d", (c or "").strip())]) >= 2 for r in t)
        if has_total and has_fee and has_years and len(t) >= 5:
            return t
    return None


def _income_statement(cid, tbls, now, rev_hint=None, fye="12-31") -> list[MetricObservation]:
    """Fee lines from the income statement (generic). Scale ($k/$m/$bn) is set by reconciling the
    table's total-revenue cell to the firm's XBRL total revenue — if it can't reconcile, the table
    is skipped rather than risk wrong fees."""
    t = _find_income(tbls)
    if not t:
        return []
    rev_end = next((i for i, r in enumerate(t) if (r[0] or "").strip().lower() in _INCOME_TOTALS), None)
    years = next(([c.strip() for c in r if re.fullmatch(r"20[0-3]\d", (c or "").strip())][:4] for r in t
                  if len([c for c in r if re.fullmatch(r"20[0-3]\d", (c or "").strip())]) >= 2), [])
    if rev_end is None or not years:
        return []
    tot = _bignums(t[rev_end], floor=1)
    if not tot:
        return []
    scale = 1e6
    if rev_hint:
        scale = next((s for s in (1e3, 1e6, 1e9) if abs(tot[0] * s - rev_hint) / rev_hint < 0.06), None)
        if not scale:
            return []  # total revenue doesn't reconcile → don't trust the fee rows
    periods = [f"{y}-{fye}" for y in years]
    out, rows, mgmt_latest = [], t[:rev_end + 1], None
    for key, inc, exc in _FEE_ROWS:
        for row in rows:
            lab = (row[0] or "").strip().lower()
            if any(p in lab for p in inc) and not any(e in lab for e in exc):
                vals = _bignums(row, floor=1)
                if vals:
                    if key == "mgmt_fee_revenue":
                        mgmt_latest = vals[0] * scale
                    for i, p in enumerate(periods):
                        if i < len(vals):
                            out.append(_obs(cid, key, vals[i] * scale, "", p, now,
                                            f"10-K income statement: {row[0]} {vals[i]:,.1f} ({p[:4]})",
                                            note="10-K consolidated statements of income (HTML table parse)."))
                    break
    # Guard: only trust the single-line split if we found a DOMINANT base-fee line (≥40% of rev).
    if not rev_hint or (mgmt_latest is not None and mgmt_latest >= 0.4 * rev_hint):
        return out

    # Channel-split fallback (e.g. AllianceBernstein: Base fees by Institutions/Retail/Private
    # Wealth) — sum the leaf "base fees" / "performance fees" rows across channels.
    def agg(pats):
        sums, found = [0.0] * len(periods), 0
        for row in rows:
            lab = (row[0] or "").strip().lower()
            if any(p in lab for p in pats) and not any(x in lab for x in ("total", "subtotal")):
                vals = _bignums(row, floor=1)
                if vals:
                    found += 1
                    for i in range(len(periods)):
                        if i < len(vals):
                            sums[i] += vals[i]
        return sums if found >= 2 else None

    base = agg(("base fees",))
    if base and 0.4 * rev_hint <= base[0] * scale <= rev_hint:  # base fees are 40-100% of revenue
        perf = agg(("performance-based fees", "performance fees"))
        out = []
        for i, p in enumerate(periods):
            out.append(_obs(cid, "mgmt_fee_revenue", base[i] * scale, "", p, now,
                            f"10-K income statement: base fees (sum across channels) {base[i]:,.1f} ({p[:4]})",
                            note="10-K income statement — base fees aggregated across channels."))
            if perf and perf[i]:
                out.append(_obs(cid, "performance_fees", perf[i] * scale, "", p, now,
                                f"10-K income statement: performance fees (sum) {perf[i]:,.1f} ({p[:4]})",
                                note="10-K income statement — performance fees aggregated across channels."))
        return out
    return []


def _bignums(row, floor=1000):
    return [n for n in (tables.num(c) for c in row) if n is not None and abs(n) >= floor]


def extract(cid: str, cik: str, now: str, period: str = "2025-12-31", aum_hint=None, rev_hint=None) -> list[MetricObservation]:
    """Breakdowns from a US filer's 10-K MD&A tables. Income-statement fee lines and
    AuM-by-asset-class are GENERIC (reconciled to the firm's XBRL total revenue / known AuM
    respectively); client channel is BlackRock-specific and no-ops elsewhere. Runs for every
    EDGAR bellwether the crawl passes in."""
    try:
        html = edgar.get_text(edgar.latest_annual_filing(cik)["url"])
    except Exception as e:
        print(f"  ! {cid} table fetch: {e}")
        return []
    tbls = tables.tables(html)
    out: list[MetricObservation] = []
    fye = period[5:] if len(period) == 10 else "12-31"  # fiscal year-end MM-DD (e.g. Franklin = 09-30)

    out += _income_statement(cid, tbls, now, rev_hint=rev_hint, fye=fye)  # fee lines, generic + reconciled
    out += _client_type(cid, tbls, now)                                   # client channel (BlackRock-style)
    out += _aum_by_asset_class(cid, tbls, now, period, aum_hint)          # generic, reconciliation-guarded

    m = re.search(r"in (?:more than |over )?(\d{2,3}) countries", re.sub(r"<[^>]+>", " ", html))
    if m:
        out.append(_obs(cid, "num_countries", int(m.group(1)), "", "2025-12-31", now,
                        f"10-K: “in {m.group(0)[3:]}”", unit="count", note="10-K business section."))

    # AuM by client region — first try a point-in-time table (reconciled, catches Invesco's
    # by-domicile split); else fall back to the BlackRock-style rollforward (ending = last big num).
    region = _breakdown(cid, tbls, "aum_by_region", _REGION_MEMBERS,
                        ["Americas", "Total"], now, period, aum_hint, "AUM by region")
    if region:
        return out + region
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
