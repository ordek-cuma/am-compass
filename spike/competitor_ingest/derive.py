"""Derived metrics — computed from base observations, never extracted.

The two decision-useful normalizers (organic growth, effective fee rate) plus operating
margin. Each derived value carries the keys it was computed from in its definition note,
and confidence = min(inputs).
"""
from __future__ import annotations

from .schema import METRIC_CATALOG, MetricObservation


def _latest(obs: list[MetricObservation], key: str) -> MetricObservation | None:
    cands = [o for o in obs if o.metric_key == key and o.value is not None]
    return max(cands, key=lambda o: o.period_end) if cands else None


def _derived(key: str, value: float, parts: list[MetricObservation], note: str, now_iso: str) -> MetricObservation:
    base = parts[0]
    return MetricObservation(
        competitor_id=base.competitor_id,
        metric_key=key,
        value=value,
        unit=METRIC_CATALOG[key]["unit"],
        period_type=base.period_type,
        period_end=base.period_end,
        currency=None,
        basis="derived",
        definition_note=note,
        source_doc="derived",
        source_url="",
        source_section=" + ".join(sorted({p.metric_key for p in parts})),
        confidence=round(min(p.confidence for p in parts), 2),
        extracted_by="derive",
        extracted_at=now_iso,
    )


def derive(competitor_id: str, obs: list[MetricObservation], now_iso: str) -> list[MetricObservation]:
    out: list[MetricObservation] = []

    rev = _latest(obs, "total_revenue")
    opinc = _latest(obs, "operating_income")
    if rev and opinc and rev.value:
        out.append(_derived("operating_margin", round(100 * opinc.value / rev.value, 1),
                            [opinc, rev], "operating_income / total_revenue", now_iso))

    fee = _latest(obs, "mgmt_fee_revenue")
    avg_aum = _latest(obs, "aum_average") or _latest(obs, "aum_total")
    if fee and avg_aum and avg_aum.value:
        out.append(_derived("effective_fee_rate", round(1e4 * fee.value / avg_aum.value, 1),
                            [fee, avg_aum], "mgmt_fee_revenue / average AuM (bps)", now_iso))

    flows = _latest(obs, "net_flows")
    aum = _latest(obs, "aum_total")
    if flows and aum and aum.value:
        # opening AuM ≈ closing − net flows (no prior period stored yet in Phase 1)
        opening = aum.value - flows.value
        if opening:
            out.append(_derived("organic_growth_rate", round(100 * flows.value / opening, 1),
                                [flows, aum], "net_flows / opening AuM (closing − flows)", now_iso))
    return out
