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
    "BL": [  # BlackRock
        ("aum_total", 14_000e9, "USD", "2025-12-31", "“total AUM was $14.0 trillion”", 0.95),
        ("net_flows", 698e9, "USD", "2025-12-31", "“record $698 billion of net inflows in 2025”", 0.95),
        ("headcount", 24_900, "count", "2025-12-31", "“approximately 24,900 employees”", 0.9),
    ],
    "TROW": [  # T. Rowe Price
        ("aum_total", 1_775.6e9, "USD", "2025-12-31", "“assets under management ended 2025 at $1,775.6 billion”", 0.95),
        ("headcount", 7_773, "count", "2025-12-31", "“employed 7,773 associates”", 0.9),
    ],
    "IVZ": [  # Invesco — ending total is split across categories; the average is stated cleanly
        ("aum_average", 2_000.1e9, "USD", "2025-12-31", "“Average AUM was $2,000.1 billion”", 0.9),
        ("headcount", 7_500, "count", "2025-12-31", "“approximately 7,500 employees”", 0.85),
    ],
    "FT": [  # Franklin Resources (fiscal year ends Sep 30)
        ("aum_total", 1_661.2e9, "USD", "2025-09-30", "“total AUM was $1,661.2 billion”", 0.9),
        ("headcount", 9_800, "count", "2025-09-30", "“approximately 9,800 employees”", 0.85),
    ],
    "AB": [  # AllianceBernstein
        ("aum_total", 866.9e9, "USD", "2025-12-31", "“AUM as of December 31, 2025 were $866.9 billion”", 0.95),
        ("headcount", 4_468, "count", "2025-12-31", "“had 4,468 full-time employees”", 0.9),
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
    return out
