"""Deterministic extraction of GAAP financials from EDGAR companyfacts (no LLM).

For each catalogued metric with us-gaap concepts, pick the latest annual (FY, 10-K/20-F)
value. This is high-confidence (1.0) structured data — the cheap, reliable half of the
pipeline. AM-specific KPIs (AuM, flows, fee rate) have no standard concept → see extract_llm.
"""
from __future__ import annotations

from . import schema
from .schema import MetricObservation

ANNUAL_FORMS = {"10-K", "20-F"}

# Per-firm us-gaap concept overrides — for metrics where a firm tags the figure under a
# non-default concept, or where the catalog's default priority would resolve to a stale or
# wrongly-scoped value. cid -> {metric_key: [concepts]} (tried in order, replacing the default).
CONCEPT_OVERRIDES: dict[str, dict[str, list[str]]] = {
    # Janus Henderson tags total revenue ONLY as ...IncludingAssessedTax (FY2025 $3,097.3M,
    # matches its reported "Total revenue" line). Its legacy "Revenues" tag is stale (latest
    # FY2017 = $592M < net income — the tell), so the default list resolved to a wrong value.
    # NB: do NOT generalise IncludingAssessedTax — for AllianceBernstein it's a subset of total.
    "JH": {"total_revenue": ["RevenueFromContractWithCustomerIncludingAssessedTax"]},
}


def _annual_facts(facts: dict, concept: str, limit: int = 5) -> list[dict]:
    """The last `limit` FY (10-K/20-F) facts for a us-gaap concept, newest first, deduped by
    period-end (keeping the most-recently-restated value for each year)."""
    node = facts.get("facts", {}).get("us-gaap", {}).get(concept)
    if not node:
        return []
    by_end: dict[str, dict] = {}
    for unit, points in node.get("units", {}).items():
        for p in points:
            if p.get("fp") == "FY" and p.get("form") in ANNUAL_FORMS and p.get("end"):
                cur = by_end.get(p["end"])
                if cur is None or (p.get("fy") or 0) >= (cur.get("fy") or 0):
                    by_end[p["end"]] = {**p, "_unit": unit}
    return sorted(by_end.values(), key=lambda x: x["end"], reverse=True)[:limit]


def extract(competitor_id: str, facts: dict, now_iso: str) -> list[MetricObservation]:
    obs: list[MetricObservation] = []
    overrides = CONCEPT_OVERRIDES.get(competitor_id, {})
    for key, spec in schema.METRIC_CATALOG.items():
        concepts = overrides.get(key) or spec.get("xbrl") or []
        if not concepts:
            continue
        rows: list[dict] = []
        used = None
        for concept in concepts:  # try concepts in priority order
            rows = _annual_facts(facts, concept)
            if rows:
                used = concept
                break
        for fact in rows:  # one observation per fiscal year → multi-year history
            unit = fact["_unit"]
            obs.append(
                MetricObservation(
                    competitor_id=competitor_id,
                    metric_key=key,
                    value=float(fact["val"]),
                    unit="USD" if unit == "USD" else unit,
                    currency="USD" if unit.startswith("USD") else None,
                    period_type="FY",
                    period_end=fact["end"],
                    basis="GAAP",
                    definition_note=spec["definition"],
                    source_doc=fact.get("form", "companyfacts"),
                    source_url="https://data.sec.gov/api/xbrl/companyfacts/",
                    source_section=f"us-gaap:{used} (FY{fact.get('fy', '')})",
                    confidence=1.0,
                    extracted_by="xbrl",
                    extracted_at=now_iso,
                )
            )
    return obs
