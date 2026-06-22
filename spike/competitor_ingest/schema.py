"""The extraction schema — one MetricObservation per (competitor, metric, period).

Every number carries its provenance (source doc + url), its basis (GAAP/adjusted),
the firm's stated definition note (to capture "definition drift"), and a confidence
flag. This is what makes the peer set comparable and auditable (citation invariant).
"""
from __future__ import annotations
from dataclasses import asdict, dataclass, field


@dataclass
class MetricObservation:
    competitor_id: str
    metric_key: str
    value: float | None
    unit: str  # 'USD' | 'EUR' | 'USD/shares' | 'bps' | 'pct' | 'count' | ...
    period_type: str  # 'FY' | 'H1' | 'Q1'..'Q4'
    period_end: str  # ISO date
    currency: str | None = None
    basis: str = "GAAP"  # 'GAAP' | 'adjusted' | 'reported'
    definition_note: str = ""
    source_doc: str = ""  # e.g. '10-K' / 'companyfacts'
    source_url: str = ""
    source_section: str = ""  # page / section / XBRL concept
    confidence: float = 1.0  # 0..1 — 1.0 for structured XBRL
    extracted_by: str = "xbrl"  # 'xbrl' | model id
    extracted_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


# Canonical metric catalogue: metric_key -> (label, canonical_unit, definition, group).
# `xbrl` lists the us-gaap concept(s) that satisfy a metric deterministically.
METRIC_CATALOG: dict[str, dict] = {
    # ---- Revenue & fees ----
    "total_revenue": dict(label="Total revenue", unit="USD", group="Revenue",
                          definition="Total net revenue for the period.",
                          xbrl=["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues"]),
    "operating_income": dict(label="Operating income", unit="USD", group="Profitability",
                            definition="Operating income (loss).", xbrl=["OperatingIncomeLoss"]),
    "net_income": dict(label="Net income", unit="USD", group="Profitability",
                       definition="Net income attributable to the company.",
                       xbrl=["NetIncomeLoss", "ProfitLoss"]),
    "eps_diluted": dict(label="Diluted EPS", unit="USD/shares", group="Profitability",
                        definition="Diluted earnings per share.", xbrl=["EarningsPerShareDiluted"]),
    # ---- AM-specific (LLM-extracted; no standard XBRL concept) ----
    "aum_total": dict(label="Total AuM (end of period)", unit="USD", group="Scale",
                      definition="Total assets under management at period end.", xbrl=[]),
    "aum_average": dict(label="Average AuM", unit="USD", group="Scale",
                        definition="Average AuM over the period (the base fees are earned on).", xbrl=[]),
    "net_flows": dict(label="Net new money / net flows", unit="USD", group="Flows",
                      definition="Net new client money for the period (inflows minus outflows).", xbrl=[]),
    "mgmt_fee_revenue": dict(label="Investment management fee revenue", unit="USD", group="Revenue",
                             definition="Advisory/management fee revenue (excl. performance fees).", xbrl=[]),
    "performance_fees": dict(label="Performance fees", unit="USD", group="Revenue",
                             definition="Performance/incentive fee revenue.", xbrl=[]),
    "headcount": dict(label="Total headcount", unit="count", group="Workforce",
                      definition="Total employees / FTEs at period end.", xbrl=[]),
    # ---- Derived (computed downstream, never extracted) ----
    "operating_margin": dict(label="Operating margin", unit="pct", group="Profitability",
                             definition="operating_income / total_revenue.", xbrl=[], derived=True),
    "organic_growth_rate": dict(label="Organic growth rate", unit="pct", group="Flows",
                                definition="net_flows / opening AuM, annualized.", xbrl=[], derived=True),
    "effective_fee_rate": dict(label="Effective fee rate", unit="bps", group="Revenue",
                               definition="mgmt_fee_revenue / average AuM.", xbrl=[], derived=True),
}
