"""Primary-sourced overlay for AMs not ingestable via EDGAR financials — European,
German, private US (Vanguard/Fidelity/PIMCO), and US group-filer AM segments.

These firms publish AuM in their own results (EUR/CHF), not via a clean API, so until a
proper URD / Bundesanzeiger harvester exists this module carries hand-verified, primary-
sourced **total AuM** (the AM headline). Group financials are bank/insurer-wide (not AM)
so they stay pending. Master-/Service-KVG platforms report **AuA** (administration), recorded
as a distinct `aua` metric so the peer AuM ranking stays apples-to-apples. Native figures are
converted to USD at a stated period-end rate; the native figure + source URL stay on each row.
"""
from __future__ import annotations

from .schema import MetricObservation

# Period-end FX (≈ 31 Dec 2025) — stated so the conversion is auditable.
FX = {"EUR": 1.08, "CHF": 1.10, "USD": 1.0}

# code -> firm. items: (metric_key, native_bn, native_ccy, source_quote, confidence)
EUROPE: dict[str, dict] = {
    # ---- European-listed ----
    "AMU": dict(name="Amundi", regime="European-listed", src="https://int.media.amundi.com/article/fourth-quarter-and-full-year-2025-results",
        items=[("aum_total", 2380.0, "EUR", "€2,380bn AUM at 31 Dec 2025 (all-time high)", 0.85),
               ("net_flows", 87.6, "EUR", "+€87.6bn net inflows FY2025", 0.85)]),
    "AGI": dict(name="Allianz Global Investors", regime="European-listed", src="https://www.allianz.com/en/investor_relations.html",
        items=[("aum_total", 591.0, "EUR", "€591bn AllianzGI AUM at Dec 2025", 0.85)]),
    "NAT": dict(name="Natixis Investment Managers", regime="European-listed", src="https://www.im.natixis.com/en-intl/about",
        items=[("aum_total", 1553.0, "USD", "$1,553bn (€1,322bn) affiliated AUM at 31 Dec 2025", 0.8)]),
    "BNP": dict(name="BNP Paribas Asset Management", regime="European-listed", src="https://group.bnpparibas/en/press-release/bnp-paribas-creates-a-leading-european-asset-manager-with-a-global-reach",
        items=[("aum_total", 1600.0, "EUR", ">€1.6tn AUM end-2025 (post-AXA IM merger)", 0.8)]),
    "Swiss Life AM": dict(name="Swiss Life Asset Managers", regime="European-listed", src="https://www.swisslife.com/en/home/about-us/divisions/asset-managers.html",
        items=[("aum_total", 145.7, "CHF", "CHF 145.7bn third-party AuM at 31 Dec 2025", 0.85)]),
    # ---- German KVG (managers) ----
    "Union": dict(name="Union Investment", regime="German KVG", src="https://www.union-investment.com/",
        items=[("aum_total", 534.6, "EUR", "€534.6bn AUM at 31 Dec 2025", 0.85)]),
    "DEKA": dict(name="DekaBank (Deka)", regime="German KVG", period="2025-06-30", src="https://www.deka.de/deka-group/who-we-are/at-a-glance-",
        items=[("aum_total", 427.0, "EUR", "€427bn total customer assets (30 Jun 2025; latest clean)", 0.75)]),
    "MEAG": dict(name="MEAG", regime="German KVG", src="https://www.meag.com/en/inform/portraet.html",
        items=[("aum_total", 368.0, "EUR", "€368bn total AuM at 31 Dec 2025 (~€63bn third-party; rest captive Munich Re/ERGO)", 0.8)]),
    "Bayern Invest": dict(name="BayernInvest", regime="German KVG", src="https://www.bayerninvest.de/",
        items=[("aum_total", 99.0, "EUR", "€99bn AUM at 30 Dec 2025", 0.85)]),
    "Deka Immobilien": dict(name="Deka Immobilien", regime="German KVG", src="https://www.deka-immobilien.de/en/about-us/",
        items=[("aum_total", 55.2, "EUR", "€55.2bn real-estate AuM at end-2025", 0.85)]),
    # ---- German Master-/Service-KVG platforms (AuA, not AuM) ----
    "Universal Invest.": dict(name="Universal Investment", regime="German KVG", src="https://www.universal-investment.com/en/",
        items=[("aua", 1400.0, "EUR", "~€1.4tn assets under administration (third-party ManCo platform)", 0.8)]),
    "HSBC T&B": dict(name="HSBC INKA", regime="German KVG", src="https://www.inka-kag.de/",
        items=[("aua", 430.0, "EUR", "€430bn+ assets under administration (Master-KVG)", 0.8)]),
    # ---- Private / Mutual (US, not on EDGAR as an AM) ----
    "Vanguard": dict(name="Vanguard", regime="Private / Mutual", period="2025-09-30", src="https://www.advratings.com/company/vanguard-group",
        items=[("aum_total", 11600.0, "USD", "$11.6tn AUM at 30 Sep 2025 (~$12tn 2025)", 0.8)]),
    "Fidelity": dict(name="Fidelity Investments", regime="Private / Mutual", src="https://about.fidelity.com/",
        items=[("aum_total", 7100.0, "USD", "$7.1tn discretionary/managed assets 2025", 0.85),
               ("aua", 18000.0, "USD", "$18tn managed + administered 2025", 0.85)]),
    "PIMCO": dict(name="PIMCO", regime="Private / Mutual", src="https://www.pimco.com/us/en/about-us",
        items=[("aum_total", 2260.0, "USD", "$2.26tn total AUM ($1.84tn third-party) at 31 Dec 2025", 0.85)]),
    # ---- US group filers: AM-SEGMENT AuM only (parent group financials are not AM-specific) ----
    "SSgA": dict(name="State Street Global Advisors", regime="US-listed", src="https://www.ssga.com/",
        items=[("aum_total", 5700.0, "USD", "$5.7tn AUM at 31 Dec 2025 (State Street AM segment)", 0.85)]),
    "JPM": dict(name="J.P. Morgan Asset Management", regime="US-listed", period="2025-09-30", src="https://am.jpmorgan.com/",
        items=[("aum_total", 4000.0, "USD", "$4tn AUM at 30 Sep 2025 (JPMorgan AM segment)", 0.8)]),
    "Goldman Sachs": dict(name="Goldman Sachs Asset Management", regime="US-listed", src="https://am.gs.com/",
        items=[("aum_total", 3600.0, "USD", "~$3.6tn assets under supervision at 31 Dec 2025 (GSAM)", 0.8)]),
    "UBS": dict(name="UBS Asset Management", regime="European-listed", src="https://www.ubs.com/global/en/assetmanagement.html",
        items=[("aum_total", 2000.0, "USD", "AM division surpassed $2tn invested assets in 2025", 0.8)]),
    "MS": dict(name="Morgan Stanley Investment Management", regime="US-listed", src="https://www.morganstanley.com/im",
        items=[("aum_total", 1895.0, "USD", "$1.895tn AUM at 31 Dec 2025 (MSIM segment)", 0.85)]),
    "PGIM": dict(name="PGIM (Prudential)", regime="US-listed", src="https://www.pgim.com/",
        items=[("aum_total", 1466.0, "USD", "$1.466tn AUM at 31 Dec 2025 (PGIM segment)", 0.85)]),
}


def build(code: str, now_iso: str) -> list[MetricObservation]:
    spec = EUROPE.get(code)
    if not spec:
        return []
    period = spec.get("period", "2025-12-31")
    out: list[MetricObservation] = []
    for key, native_bn, ccy, quote, conf in spec["items"]:
        usd = native_bn * FX[ccy] * 1e9
        out.append(MetricObservation(
            competitor_id=code, metric_key=key, value=usd, unit="USD", currency="USD",
            period_type="FY", period_end=period, basis="reported",
            definition_note=f"Native {ccy} {native_bn:,.1f}bn → USD at {FX[ccy]} (period-end {period}).",
            source_doc="results", source_url=spec["src"], source_section=quote,
            confidence=conf, extracted_by="analyst-eu", extracted_at=now_iso,
        ))
    return out
