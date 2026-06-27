"""Analyst overlay — hand-verified AM KPIs for firms not yet run through the LLM extractor.

A stopgap until `ANTHROPIC_API_KEY` is set and extract_llm fills these automatically. Each
figure is read verbatim from the firm's latest 10-K (quote stored as source_section) and
flagged basis='reported', extracted_by='analyst'. Conservative: only unambiguous firmwide
totals are entered; everything else stays pending (grey) so coverage is honest.
"""
from __future__ import annotations

from .schema import MetricObservation

# competitor_id -> list of (metric_key, value_base_units, unit, period_end, source_quote, confidence)
# All figures read verbatim from each firm's FY2025 10-K (US-listed bellwethers).
OVERLAY: dict[str, list[tuple]] = {
    "BL": [  # BlackRock — figures verbatim from the FY2025 10-K (blk-20251231)
        ("aum_total", 14_000e9, "USD", "2025-12-31", "“total AUM was $14.0 trillion”", 0.95),
        ("net_flows", 698e9, "USD", "2025-12-31", "“record $698 billion of net inflows in 2025”", 0.95),
        ("headcount", 24_900, "count", "2025-12-31", "“approximately 24,900 employees”", 0.9),
        # As-adjusted operating margin (non-GAAP) — GAAP→as-adjusted reconciliation table:
        ("adj_operating_margin", 44.1, "pct", "2025-12-31", "10-K reconciliation: “Operating margin, as adjusted 44.1%” (FY2025)", 0.95),
        ("adj_operating_margin", 44.5, "pct", "2024-12-31", "10-K reconciliation: “Operating margin, as adjusted … 44.5%” (FY2024)", 0.95),
        # Capital — aggregate market value of common stock held by non-affiliates (10-K cover):
        ("market_cap", 159e9, "USD", "2025-06-30",
         "10-K cover: “aggregate market value of … common stock held by nonaffiliates … approximately $159 billion” (float at 30 Jun 2025)", 0.7),
    ],
    "TROW": [  # T. Rowe Price
        ("aum_total", 1_775.6e9, "USD", "2025-12-31", "“assets under management ended 2025 at $1,775.6 billion”", 0.95),
        ("net_flows", -56.9e9, "USD", "2025-12-31", "“net cash outflows of $56.9 billion” (FY2025 10-K)", 0.75),
        ("headcount", 7_773, "count", "2025-12-31", "“employed 7,773 associates”", 0.9),
    ],
    "IVZ": [  # Invesco — ending AUM is the AUM-rollforward "Ending Assets (December 31)" line
        ("aum_total", 2_169.9e9, "USD", "2025-12-31", "10-K AUM rollforward: “Ending Assets (December 31) $2,169.9” billion", 0.95),
        ("aum_total", 1_846.0e9, "USD", "2024-12-31", "10-K AUM rollforward: ending assets $1,846.0bn (FY2024)", 0.9),
        ("aum_total", 1_585.3e9, "USD", "2023-12-31", "10-K AUM rollforward: ending assets $1,585.3bn (FY2023)", 0.9),
        ("aum_average", 2_000.1e9, "USD", "2025-12-31", "“Average AUM was $2,000.1 billion”", 0.9),
        ("net_flows", 81.2e9, "USD", "2025-12-31", "AUM rollforward: “Net long-term flows 81.2” billion (FY2025)", 0.9),
        ("headcount", 7_500, "count", "2025-12-31", "“approximately 7,500 employees”", 0.85),
    ],
    "FT": [  # Franklin Resources (fiscal year ends Sep 30)
        ("aum_total", 1_661.2e9, "USD", "2025-09-30", "“total AUM was $1,661.2 billion”", 0.9),
        ("net_flows", -97.4e9, "USD", "2025-09-30", "AUM rollforward: “Long-term net flows (97.4)” billion (FY2025)", 0.85),
        ("headcount", 9_800, "count", "2025-09-30", "“approximately 9,800 employees”", 0.85),
    ],
    "AB": [  # AllianceBernstein
        ("aum_total", 866.9e9, "USD", "2025-12-31", "“AUM as of December 31, 2025 were $866.9 billion”", 0.95),
        ("net_flows", -11.3e9, "USD", "2025-12-31", "“net outflows of $11.3 billion” (Inst −$4.6bn, Retail −$9.1bn, PW +$2.4bn)", 0.9),
        ("market_impact", 86.0e9, "USD", "2025-12-31", "“market appreciation of $86.0 billion” (2025)", 0.9),
        ("headcount", 4_468, "count", "2025-12-31", "“had 4,468 full-time employees”", 0.9),
    ],
    "FED": [  # Federated Hermes
        ("aum_total", 902.6e9, "USD", "2025-12-31", "“$902.6 billion in assets under management”", 0.92),
        ("headcount", 2_091, "count", "2025-12-31", "“had 2,091 employees”", 0.85),
    ],
    "WisdomTree": [  # WisdomTree
        ("aum_total", 144.5e9, "USD", "2025-12-31", "“AUM of $144.5 billion at December 31, 2025”", 0.95),
        ("net_flows", 8.5e9, "USD", "2025-12-31", "“net inflows of $8.5 billion” (FY2025 10-K)", 0.8),
        ("headcount", 360, "count", "2025-12-31", "“had 360 full-time employees”", 0.9),
    ],
    "JH": [  # Janus Henderson
        ("aum_total", 493.2e9, "USD", "2025-12-31", "“assets under management (“AUM”) of $493.2 billion”", 0.95),
        ("net_flows", 56.5e9, "USD", "2025-12-31", "“Net inflows for the year ended December 31, 2025, were $56.5” billion (10-K MD&A; matches the capability rollforward Total)", 0.9),
        ("headcount", 2_300, "count", "2025-12-31", "“2,300 employees”", 0.85),
    ],
    "AMG": [  # Affiliated Managers Group
        ("aum_total", 813e9, "USD", "2025-12-31", "“assets under management were approximately $813 billion”", 0.85),
        ("headcount", 5_600, "count", "2025-12-31", "“approximately 5,600 employees”", 0.85),
    ],
    "Blackstone": [  # AUM isn't in XBRL; from the FY2025 8-K
        ("aum_total", 1_241.7e9, "USD", "2025-12-31", "Total AUM $1,241.7bn at 31 Dec 2025 (fee-earning $906.2bn) — FY2025 8-K", 0.9),
        ("headcount", 5_285, "count", "2025-12-31", "10-K: “we employed approximately 5,285 people” (31 Dec 2025)", 0.9),
    ],
}


# Cited AuM breakdowns the table parser can't safely auto-reconcile (disclosed only on an
# average basis, or split across tangled rollforward sub-tables). Read verbatim from each 10-K;
# every member reconciles to the firm's disclosed total. competitor_id ->
# [(metric_key, member, value_base_units, unit, period_end, source_quote, confidence)].
BREAKDOWN: dict[str, list[tuple]] = {
    # T. Rowe Price discloses asset-class split ONLY on an AVERAGE-AUM basis (10-K MD&A
    # "Average AUM (in billions)"); ending AUM is not split by class. Members sum to the
    # disclosed FY2025 average AUM of $1,677.3B. Quoted as average — mix proportions are the signal.
    "TROW": [
        ("aum_by_asset_class", "Equity", 840.9e9, "USD", "2025-12-31", "10-K “Average AUM (in billions): Equity 840.9” (FY2025)", 0.9),
        ("aum_by_asset_class", "Multi-asset", 580.7e9, "USD", "2025-12-31", "10-K “Average AUM … Multi-asset 580.7” (FY2025)", 0.9),
        ("aum_by_asset_class", "Fixed income / money market", 201.0e9, "USD", "2025-12-31", "10-K “Average AUM … Fixed income, including money market 201.0” (FY2025)", 0.9),
        ("aum_by_asset_class", "Alternatives", 54.7e9, "USD", "2025-12-31", "10-K “Average AUM … Alternatives 54.7” (FY2025)", 0.9),
    ],
    # WisdomTree (ETF issuer) discloses AUM by product category only in per-category rollforward
    # sub-tables. Ending (End-of-period) assets, FY2025 10-K, $M; the 8 categories + Private
    # Assets sum to the firm's $144,524M total AUM. Native categories kept (the real ETF mix).
    "WisdomTree": [
        ("aum_by_asset_class", "U.S. Equity", 41_428e6, "USD", "2025-12-31", "10-K product-category rollforward: U.S. Equity end-of-period assets $41,428M (FY2025)", 0.9),
        ("aum_by_asset_class", "Commodity & Currency", 36_980e6, "USD", "2025-12-31", "10-K: Commodity & Currency end-of-period assets $36,980M (FY2025)", 0.9),
        ("aum_by_asset_class", "Int'l Developed Equity", 25_616e6, "USD", "2025-12-31", "10-K: International Developed Market Equity end-of-period assets $25,616M (FY2025)", 0.9),
        ("aum_by_asset_class", "Fixed Income", 21_074e6, "USD", "2025-12-31", "10-K: Fixed Income end-of-period assets $21,074M (FY2025)", 0.9),
        ("aum_by_asset_class", "Emerging Market Equity", 10_643e6, "USD", "2025-12-31", "10-K: Emerging Market Equity end-of-period assets $10,643M (FY2025)", 0.9),
        ("aum_by_asset_class", "Leveraged & Inverse", 3_275e6, "USD", "2025-12-31", "10-K: Leveraged & Inverse end-of-period assets $3,275M (FY2025)", 0.9),
        ("aum_by_asset_class", "Cryptocurrency", 2_242e6, "USD", "2025-12-31", "10-K: Cryptocurrency end-of-period assets $2,242M (FY2025)", 0.9),
        ("aum_by_asset_class", "Private Assets", 1_889e6, "USD", "2025-12-31", "10-K: Private Assets end-of-period assets $1,889M (FY2025, Ceres acquisition)", 0.85),
        ("aum_by_asset_class", "Alternatives", 1_377e6, "USD", "2025-12-31", "10-K: Alternatives end-of-period assets $1,377M (FY2025)", 0.9),
    ],
    # Janus Henderson discloses AUM by capability in a closing-AUM rollforward (ending column).
    # Closing AUM at 31 Dec 2025 by capability; members reconcile exactly to the $493.2B total.
    "JH": [
        ("aum_by_asset_class", "Equities", 256.6e9, "USD", "2025-12-31", "10-K capability rollforward: Equities closing AUM $256.6B (31 Dec 2025)", 0.9),
        ("aum_by_asset_class", "Fixed Income", 155.8e9, "USD", "2025-12-31", "10-K capability rollforward: Fixed Income closing AUM $155.8B (31 Dec 2025)", 0.9),
        ("aum_by_asset_class", "Multi-Asset", 58.8e9, "USD", "2025-12-31", "10-K capability rollforward: Multi-Asset closing AUM $58.8B (31 Dec 2025)", 0.9),
        ("aum_by_asset_class", "Alternatives", 22.0e9, "USD", "2025-12-31", "10-K capability rollforward: Alternatives closing AUM $22.0B (31 Dec 2025)", 0.9),
    ],
}


def overlay(competitor_id: str, now_iso: str, source_url: str = "") -> list[MetricObservation]:
    out: list[MetricObservation] = []
    for key, value, unit, period_end, quote, conf in OVERLAY.get(competitor_id, []):
        out.append(MetricObservation(
            competitor_id=competitor_id,
            metric_key=key,
            value=float(value),
            unit=unit,
            currency="USD" if unit == "USD" else None,
            period_type="FY",
            period_end=period_end,
            basis="reported",
            definition_note="Hand-verified from the 10-K (analyst overlay; pending LLM extractor).",
            source_doc="10-K",
            source_url=source_url,
            source_section=quote,
            confidence=conf,
            extracted_by="analyst",
            extracted_at=now_iso,
        ))
    for key, member, value, unit, period_end, quote, conf in BREAKDOWN.get(competitor_id, []):
        out.append(MetricObservation(
            competitor_id=competitor_id,
            metric_key=key,
            member=member,
            value=float(value),
            unit=unit,
            currency="USD" if unit == "USD" else None,
            period_type="FY",
            period_end=period_end,
            basis="reported",
            definition_note="Hand-verified AuM breakdown from the 10-K (analyst overlay; reconciles to disclosed total).",
            source_doc="10-K",
            source_url=source_url,
            source_section=quote,
            confidence=conf,
            extracted_by="analyst",
            extracted_at=now_iso,
        ))
    return out
