"""Phase 2 (interim) — European AMs that aren't on SEC EDGAR.

These firms publish AuM in their own results (EUR/CHF), not via a clean API, so until a
proper URD/IR harvester exists this module carries hand-verified, primary-sourced **total
AuM** (the AM-specific headline; group financials here are bank/insurer-wide, not AM, so
they stay pending). Native figures are converted to USD at a stated rate for the peer view;
the native figure + source URL are kept on every observation.
"""
from __future__ import annotations

from .schema import MetricObservation

# Period-end FX (≈ 31 Dec 2025) — stated so the conversion is auditable, not hidden.
FX = {"EUR": 1.08, "CHF": 1.10, "USD": 1.0}

# competitor_id -> firm; items: (metric_key, native_bn, native_ccy, source_quote, confidence)
EUROPE: dict[str, dict] = {
    "AMU": dict(name="Amundi", src="https://int.media.amundi.com/article/fourth-quarter-and-full-year-2025-results",
        items=[
            ("aum_total", 2380.0, "EUR", "€2,380bn AUM at 31 Dec 2025 (all-time high)", 0.85),
            ("net_flows", 87.6, "EUR", "+€87.6bn net inflows FY2025", 0.85),
        ]),
    "AGI": dict(name="Allianz Global Investors", src="https://www.allianz.com/en/investor_relations.html",
        items=[("aum_total", 591.0, "EUR", "€591bn AllianzGI AUM at Dec 2025 (Allianz disclosure)", 0.85)]),
    "NAT": dict(name="Natixis Investment Managers", src="https://www.im.natixis.com/en-intl/about",
        items=[("aum_total", 1553.0, "USD", "$1,553bn (€1,322bn) affiliated AUM at 31 Dec 2025", 0.8)]),
    "BNP": dict(name="BNP Paribas Asset Management", src="https://group.bnpparibas/en/press-release/bnp-paribas-creates-a-leading-european-asset-manager-with-a-global-reach",
        items=[("aum_total", 1600.0, "EUR", ">€1.6tn AUM end-2025 (post-AXA IM merger, 31 Dec 2025)", 0.8)]),
    "Swiss Life AM": dict(name="Swiss Life Asset Managers", src="https://www.swisslife.com/en/home/about-us/divisions/asset-managers.html",
        items=[("aum_total", 145.7, "CHF", "CHF 145.7bn third-party AuM at 31 Dec 2025", 0.85)]),
}


def build(competitor_id: str, now_iso: str) -> list[MetricObservation]:
    spec = EUROPE.get(competitor_id)
    if not spec:
        return []
    out: list[MetricObservation] = []
    for key, native_bn, ccy, quote, conf in spec["items"]:
        usd = native_bn * FX[ccy] * 1e9
        note = f"Native {ccy} {native_bn:,.1f}bn → USD at {FX[ccy]} (period-end ≈ 31 Dec 2025)."
        out.append(MetricObservation(
            competitor_id=competitor_id, metric_key=key, value=usd, unit="USD", currency="USD",
            period_type="FY", period_end="2025-12-31", basis="reported", definition_note=note,
            source_doc="results", source_url=spec["src"], source_section=quote,
            confidence=conf, extracted_by="analyst-eu", extracted_at=now_iso,
        ))
    return out
