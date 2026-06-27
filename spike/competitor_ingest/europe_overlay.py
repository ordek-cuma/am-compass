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
FX = {"EUR": 1.08, "CHF": 1.10, "GBP": 1.27, "USD": 1.0}

# Non-monetary metric "currencies": a raw value passes through unscaled (no FX, no ×1e9).
RAW_UNITS = {"count": "count", "pct": "pct", "bps": "bps"}

# code -> firm. items: (metric_key, native_value, native_ccy, source_quote, confidence[, period]).
# ccy "count" = a raw count (headcount/num_countries). breakdowns: (key, member, native_bn, ccy, quote, conf).
# All FY2025 (31 Dec 2025) unless a period override is given. Group-filer AM segments report
# segment PRE-TAX income → stored as operating_income (net_income only where after-tax is disclosed).
EUROPE: dict[str, dict] = {
    # ---- European-listed ----
    "AMU": dict(name="Amundi", regime="European-listed", src="https://about.amundi.com/financial-results",
        items=[("aum_total", 2380.0, "EUR", "“Record assets under management, at €2,380bn at end-December”", 0.9),
               ("net_flows", 87.6, "EUR", "“Net inflows for the year reached +€87.6bn”", 0.9),
               ("total_revenue", 3.342, "EUR", "“Net revenue 3,342” (€m, FY2025)", 0.9),
               ("net_income", 1.592, "EUR", "“Accounting net income Group share amounted to €1,592m”", 0.9),
               ("headcount", 5600, "count", "“5,600 employees in 34 countries”", 0.85),
               ("num_countries", 34, "count", "“5,600 employees in 34 countries”", 0.85),
               ("mgmt_fee_revenue", 3.052, "EUR", "Amundi FY2025 P&L: “Net management fees 3,052”", 0.85),
               ("performance_fees", 0.173, "EUR", "Amundi FY2025 P&L: “Performance fees 173”", 0.85),
               ("operating_income", 1.636, "EUR", "Amundi FY2025: “Gross operating income - Adjusted 1,636” (cost/income 52.1%)", 0.85),
               ("market_cap", 16.95, "EUR", "Amundi market cap €16.95bn (stockanalysis.com, 26 Jun 2026)", 0.7, "2025-12-31", "external"),
               ("dividends_per_share", 4.25, "EUR", "“we are now proposing a dividend of €4.25 per share for 2025”", 0.85)],
        breakdowns=[("aum_by_asset_class", "Equities", 623.0, "EUR", "Amundi FY2025 AUM: Equities €623bn", 0.85),
                    ("aum_by_asset_class", "Bonds", 761.0, "EUR", "Amundi FY2025 AUM: Bonds €761bn", 0.85),
                    ("aum_by_asset_class", "Multi-asset", 286.0, "EUR", "Amundi FY2025 AUM: Multi-assets €286bn", 0.85),
                    ("aum_by_asset_class", "Treasury / MMF", 180.0, "EUR", "Amundi FY2025 AUM: Treasury products excl. JVs €180bn", 0.85),
                    ("aum_by_asset_class", "Real / alternative / structured", 106.0, "EUR", "Amundi FY2025 AUM: Private, alternative & structured assets €106bn", 0.85),
                    ("aum_by_asset_class", "JVs", 364.0, "EUR", "Amundi FY2025 AUM: JVs €364bn", 0.85),
                    ("aum_by_asset_class", "Victory (US distribution)", 60.0, "EUR", "Amundi FY2025 AUM: Victory - US Distribution €60bn (sums to €2,380bn)", 0.85),
                    ("aum_by_region", "France", 1051.0, "EUR", "Amundi FY2025 AUM by region: France €1,051bn", 0.85),
                    ("aum_by_region", "Italy", 199.0, "EUR", "Amundi FY2025 AUM by region: Italy €199bn", 0.85),
                    ("aum_by_region", "Rest of Europe", 517.0, "EUR", "Amundi FY2025 AUM by region: Rest of Europe €517bn", 0.85),
                    ("aum_by_region", "Asia", 475.0, "EUR", "Amundi FY2025 AUM by region: Asia €475bn", 0.85),
                    ("aum_by_region", "Rest of world", 138.0, "EUR", "Amundi FY2025 AUM by region: Rest of the world €138bn (sums to €2,380bn)", 0.85)]),
    "DWS": dict(name="DWS Group", regime="European-listed", src="https://group.dws.com/ir/reports-and-events/",
        items=[("aum_total", 1085.0, "EUR", "DWS FY2025: “Total AuM … 1,085” €bn (31 Dec 2025)", 0.9),
               ("net_flows", 51.0, "EUR", "DWS FY2025: “total net flows of €51.0bn” (long-term €33.7bn)", 0.9),
               ("total_revenue", 3.155, "EUR", "DWS FY2025: “Total revenues at €3,155mn, up 14%”", 0.9),
               ("net_income", 0.927, "EUR", "DWS FY2025: “Net income attributable to DWS Group shareholders … 927” (€m)", 0.9),
               ("operating_income", 1.324, "EUR", "DWS FY2025: “Profit before tax … 1,324” (€m)", 0.9),
               ("headcount", 4826, "count", "DWS FY2025: “FTE (#) 4,826”", 0.9),
               ("mgmt_fee_revenue", 2.597, "EUR", "DWS FY2025: “Management fees and other recurring revenues … 2,597” (€m)", 0.85),
               ("performance_fees", 0.318, "EUR", "DWS FY2025: “Performance and transaction fees … 318” (€m)", 0.85),
               ("dividends_per_share", 3.00, "EUR", "DWS FY2025: “ordinary dividend of €3.00 per share”", 0.85),
               ("market_cap", 11.0, "EUR", "DWS market cap ≈€11bn (~€55/sh × ~200m shares; Deutsche Bank ~79%)", 0.55, "2026-06-26", "external")],
        breakdowns=[("aum_by_asset_class", "Passive (Xtrackers)", 395.0, "EUR", "DWS FY2025 AuM: Passive €395.0bn (31 Dec 2025)", 0.85),
                    ("aum_by_asset_class", "Active Fixed Income", 208.6, "EUR", "DWS FY2025 AuM: Active Fixed Income €208.6bn", 0.85),
                    ("aum_by_asset_class", "Active Equity", 116.7, "EUR", "DWS FY2025 AuM: Active Equity €116.7bn", 0.85),
                    ("aum_by_asset_class", "Alternatives", 108.1, "EUR", "DWS FY2025 AuM: Alternatives €108.1bn", 0.85),
                    ("aum_by_asset_class", "Cash", 105.7, "EUR", "DWS FY2025 AuM: Cash €105.7bn", 0.85),
                    ("aum_by_asset_class", "Active SQI", 80.3, "EUR", "DWS FY2025 AuM: Active SQI €80.3bn", 0.85),
                    ("aum_by_asset_class", "Active Multi-Asset", 54.0, "EUR", "DWS FY2025 AuM: Active Multi Asset €54.0bn", 0.85),
                    ("aum_by_asset_class", "Advisory", 16.1, "EUR", "DWS FY2025 AuM: Advisory Services €16.1bn (sums to €1,084.5bn)", 0.85),
                    ("aum_by_region", "Germany", 510.3, "EUR", "DWS FY2025 AuM by region: Germany €510.3bn", 0.85),
                    ("aum_by_region", "EMEA ex-Germany", 297.4, "EUR", "DWS FY2025 AuM by region: EMEA excl. Germany €297.4bn", 0.85),
                    ("aum_by_region", "Americas", 221.8, "EUR", "DWS FY2025 AuM by region: Americas €221.8bn", 0.85),
                    ("aum_by_region", "Asia-Pacific", 55.0, "EUR", "DWS FY2025 AuM by region: Asia Pacific €55.0bn (sums to €1,084.5bn)", 0.85)]),
    "Schroders": dict(name="Schroders", regime="European-listed", src="https://www.schroders.com/en/global/individual/corporate-transparency/reporting/",
        items=[("aum_total", 823.7, "GBP", "Schroders FY2025: “assets under management … up 6% to £823.7 billion” (incl. JVs)", 0.9),
               ("net_flows", 11.2, "GBP", "Schroders FY2025: “£11.2 billion of net new business” (ex-JV)", 0.85),
               ("total_revenue", 2.7005, "GBP", "Schroders FY2025: “Statutory net operating income … 2,700.5” (£m)", 0.9),
               ("net_income", 0.5398, "GBP", "Schroders FY2025: profit after tax attributable £539.8m", 0.9),
               ("operating_income", 0.6738, "GBP", "Schroders FY2025: “Statutory profit before tax of £673.8 million”", 0.9),
               ("mgmt_fee_revenue", 2.7458, "GBP", "Schroders FY2025: “Management fees … 2,745.8” (£m, segment total)", 0.85),
               ("performance_fees", 0.0516, "GBP", "Schroders FY2025: “Performance fees … 51.6” (£m, segment)", 0.85),
               ("dividends_per_share", 0.215, "GBP", "Schroders FY2025: “Dividend per share (pence) 21.5”", 0.85),
               ("market_cap", 9.27, "GBP", "Schroders market cap ≈£9.27bn (aggregator, ~Jun 2026)", 0.6, "2026-06-26", "external")],
        breakdowns=[("aum_by_asset_class", "Equities", 225.1, "GBP", "Schroders FY2025 Asset Mgmt AuM: Equities £225.1bn", 0.8),
                    ("aum_by_asset_class", "Core solutions", 118.6, "GBP", "Schroders FY2025 Asset Mgmt AuM: Core solutions £118.6bn", 0.8),
                    ("aum_by_asset_class", "Multi-asset", 102.4, "GBP", "Schroders FY2025 Asset Mgmt AuM: Multi-asset £102.4bn", 0.8),
                    ("aum_by_asset_class", "Fixed income", 87.0, "GBP", "Schroders FY2025 Asset Mgmt AuM: Fixed income £87.0bn", 0.8),
                    ("aum_by_asset_class", "Private markets", 72.6, "GBP", "Schroders FY2025: Schroders Capital £72.6bn (Asset Mgmt scope = £605.7bn, ex Wealth/JV)", 0.8)]),
    "abrdn": dict(name="Aberdeen Group (abrdn)", regime="European-listed", src="https://www.aberdeeninvestments.com/en-gb/institutional/insights-and-research/results-reports-and-presentations",
        items=[("aum_total", 556.0, "GBP", "Aberdeen Group FY2025: “AUMA £556.0bn” (31 Dec 2025)", 0.9),
               ("net_flows", -3.9, "GBP", "Aberdeen Group FY2025: “Net flows £(3.9)bn”", 0.85),
               ("total_revenue", 1.276, "GBP", "Aberdeen Group FY2025: “adjusted net operating revenue … £1,276m”", 0.9),
               ("net_income", 0.388, "GBP", "Aberdeen Group FY2025: profit attributable to equity shareholders £388m", 0.9),
               ("operating_income", 0.264, "GBP", "Aberdeen Group FY2025: “Adjusted operating profit £264m”", 0.9),
               ("headcount", 4435, "count", "Aberdeen Group FY2025: “FTE as at 31 December 2025 of 4,435”", 0.85),
               ("dividends_per_share", 0.146, "GBP", "Aberdeen Group FY2025: “total dividend for the year of 14.6p”", 0.85),
               ("market_cap", 4.44, "GBP", "Aberdeen Group market cap ≈£4.44bn (aggregator, ~Jun 2026)", 0.55, "2026-06-26", "external")]),
    "MandG": dict(name="M&G", regime="European-listed", src="https://www.mandg.com/investor",
        items=[("aum_total", 375.9, "GBP", "M&G FY2025: “Total AUMA has increased to £375.9 billion”", 0.9),
               ("net_flows", -1.6, "GBP", "M&G FY2025: total net client flows £(1.6)bn (open business +£7.8bn)", 0.85),
               ("net_income", 0.314, "GBP", "M&G FY2025: “IFRS result after tax attributable … profit of £314 million”", 0.9),
               ("operating_income", 0.838, "GBP", "M&G FY2025: “Adjusted operating profit before tax … £838 million”", 0.9),
               ("operating_margin", 25.0, "pct", "M&G Asset Management FY2025 cost/income ratio 75% (recurring revenue £1,066m) → 25% operating margin", 0.8),
               ("headcount", 8282, "count", "M&G FY2025: “Average staff headcount 8,282” (>6,000 permanent)", 0.8),
               ("dividends_per_share", 0.205, "GBP", "M&G FY2025: “total dividend of 20.5 pence per share”", 0.85),
               ("market_cap", 8.0, "GBP", "M&G market cap ≈£8.0bn (aggregator, 26 Jun 2026)", 0.65, "2026-06-26", "external")],
        breakdowns=[("aum_by_channel", "Life", 192.2, "GBP", "M&G FY2025 AUMA: Life £192.2bn (31 Dec 2025)", 0.85),
                    ("aum_by_channel", "Asset Management", 182.9, "GBP", "M&G FY2025 AUMA: Asset Management £182.9bn", 0.85),
                    ("aum_by_channel", "Corporate", 0.8, "GBP", "M&G FY2025 AUMA: Corporate assets £0.8bn (sums to £375.9bn)", 0.85)]),
    "AGI": dict(name="Allianz Global Investors", regime="European-listed", src="https://www.allianz.com/en/investor_relations/results-reports/results-presentations.html",
        items=[("aum_total", 591.0, "EUR", "€591bn AllianzGI total AUM at Dec 2025 (€417bn third-party). P&L disclosed in the Allianz FY2025 analyst presentation.", 0.8),
               ("total_revenue", 2.051, "EUR", "Allianz FY2025: “AllianzGI (EUR mn) … 2,051” operating revenues", 0.85),
               ("operating_income", 0.770, "EUR", "Allianz FY2025: “AllianzGI – OP at EUR 770mn, up 5%”", 0.85),
               ("net_flows", 6.1, "EUR", "Allianz FY2025: “3rd party net flows AllianzGI: EUR +6bn … +6.1”", 0.85),
               ("mgmt_fee_revenue", 1.940, "EUR", "Allianz FY2025: AllianzGI AuM-driven & other revenues €1,940m", 0.8),
               ("performance_fees", 0.111, "EUR", "Allianz FY2025: AllianzGI performance fees €111m", 0.8),
               ("headcount", 2900, "count", "AllianzGI ≈2,900 employees (industry/aggregator; Allianz doesn't split AM headcount; its site states only 700+ investment pros)", 0.5, "2025-12-31", "external")]),
    "NAT": dict(name="Natixis Investment Managers", regime="European-listed", src="https://natixis.groupebpce.com/",
        items=[("aum_total", 1323.0, "EUR", "“assets under management reached a historic high of €1,323 billion” (31 Dec 2025)", 0.85),
               ("net_flows", 40.0, "EUR", "“Net inflows in Asset Management … reached 40 billion euros” (FY2025)", 0.85),
               ("total_revenue", 3.540, "EUR", "“Asset & Wealth Management revenues … €3,540m” (bundles Wealth Mgmt)", 0.8),
               ("operating_income", 0.776, "EUR", "AWM gross operating income €776m FY2025 (pre-tax; bundles Wealth Mgmt)", 0.75),
               ("num_countries", 20, "count", "Natixis URD: “integrated distribution network established in over 20 countries”", 0.7)]),
    "BNP": dict(name="BNP Paribas Asset Management", regime="European-listed", src="https://invest.bnpparibas/en/document/universal-registration-document-annual-financial-report-2025-pdf",
        items=[("aum_total", 1624.0, "EUR", "“€1,624bn at Asset Management (including AXA IM and Real Estate)” at 31 Dec 2025", 0.85),
               ("net_flows", 35.8, "EUR", "“Asset Management had very good inflows … €35.8bn in 2025, including AXA IM and REIM”", 0.8),
               ("total_revenue", 1.924, "EUR", "BNP IPS 2025 Dashboard: Asset Management “Revenues … 1,924” (€m; incl. Real Estate & IPS Investments, H2 AXA IM)", 0.8),
               ("operating_income", 0.321, "EUR", "BNP IPS 2025 Dashboard: Asset Management “Pre-Tax Income 321” (€m; operating income €362m)", 0.8),
               ("headcount", 2100, "count", "URD 2025: “BNP Paribas AM … employing over 2,100 employees in 32 countries”", 0.8),
               ("num_countries", 32, "count", "URD 2025: “over 2,100 employees in 32 countries”", 0.8)]),
    "Swiss Life AM": dict(name="Swiss Life Asset Managers", regime="European-listed", src="https://www.swisslife-am.com/en/home.html",
        items=[("aum_total", 145.7, "CHF", "“over CHF 145.7 billion for third-party asset management” (31 Dec 2025)", 0.85),
               ("net_flows", 17.7, "CHF", "“nearly doubled net new assets in TPAM business to CHF 17.7 billion in 2025”", 0.85),
               ("total_revenue", 1.148, "CHF", "Swiss Life FY2025: Asset Managers “Commission and other net income … 1 148” (CHF m; TPAM CHF 795m)", 0.8),
               ("operating_income", 0.414, "CHF", "Swiss Life FY2025: Asset Managers “Segment result 414” (CHF m)", 0.8),
               ("headcount", 2300, "count", "“More than 2300 employees work for Swiss Life Asset Managers in Europe.”", 0.7)]),
    # AXA IM Alts: sold to BNP Paribas and merged into BNP Paribas AM on 31 Dec 2025 — no own AuM disclosed.
    "AXA IM Alts.": dict(name="AXA IM Alts", regime="European-listed",
        src="https://www.axa.com/en/investor/annual-and-interim-reports", items=[]),
    # ---- German KVG (managers) ----
    "Union": dict(name="Union Investment", regime="German KVG", src="https://unternehmen.union-investment.de/",
        items=[("aum_total", 534.6, "EUR", "“Assets under Management … Höchststand von 534,6 Milliarden Euro” (€534.6bn, 31 Dec 2025)", 0.9),
               ("net_flows", 23.3, "EUR", "“Der Nettoabsatz belief sich auf 23,3 Milliarden Euro” (net sales €23.3bn FY2025)", 0.85),
               ("operating_income", 1.185, "EUR", "“Das Betriebsergebnis … auf 1.185 Millionen Euro” (operating result €1,185m FY2025)", 0.85),
               ("headcount", 4400, "count", "“Rund 4.400 Mitarbeitende” (~4,400 employees)", 0.85)],
        breakdowns=[("aum_by_channel", "Retail / private", 270.8, "EUR", "“270,8 Mrd. Euro auf das Privatkundengeschäft” (retail €270.8bn)", 0.85),
                    ("aum_by_channel", "Institutional", 263.8, "EUR", "“263,8 Mrd. Euro auf institutionelle Anleger” (institutional €263.8bn; sums to €534.6bn)", 0.85)]),
    "DEKA": dict(name="DekaBank (Deka)", regime="German KVG", src="https://www.deka.de/deka-gruppe/investor-relations/kennzahlen",
        items=[("aum_total", 452.0, "EUR", "“Summe Asset Management und Deka-Zertifikate … 451.971 Mio. €” (€452bn customer assets, 31 Dec 2025)", 0.85),
               ("net_flows", 24.437, "EUR", "“Asset Management Nettovertriebsleistung: 24.437 Mio. €” (net sales €24.4bn FY2025)", 0.85),
               ("total_revenue", 2.4243, "EUR", "“Summe Erträge: 2.424,3 Mio. €” (total income FY2025)", 0.85),
               ("operating_income", 0.9246, "EUR", "“Ergebnis vor Steuern: 924,6 Mio. €” (pre-tax result FY2025)", 0.85),
               ("headcount", 5953, "count", "“Mitarbeitende: 5.953” (FY2025)", 0.85)]),
    "MEAG": dict(name="MEAG", regime="German KVG", src="https://www.meag.com/en/inform/portraet.html",
        items=[("aum_total", 368.0, "EUR", "€368bn total AuM end-2025 (~€63bn third-party; rest captive Munich Re/ERGO)", 0.8),
               ("headcount", 850, "count", "“ca. 850 employees” (MEAG corporate portrait)", 0.6)]),
    "Bayern Invest": dict(name="BayernInvest", regime="German KVG", src="https://www.bayerninvest.de/",
        items=[("aum_total", 99.0, "EUR", "€99bn AUM at 31 Dec 2025 (€102bn at 28.02.2026 per company portrait)", 0.8),
               ("headcount", 200, "count", "“Rund 200 Mitarbeitende arbeiten in München” (~200 employees)", 0.6)]),
    "Deka Immobilien": dict(name="Deka Immobilien", regime="German KVG", src="https://www.deka-immobilien.de/en/insights-news/",
        items=[("aum_total", 55.2, "EUR", "“asset management volume … amounted to €55.2 billion at the end of 2025”", 0.85),
               ("headcount", 640, "count", "“a total of around 640 professionals” (Deka Immobilien)", 0.6)]),
    # ---- German Master-/Service-KVG platforms (AuA, not AuM) ----
    "Universal Invest.": dict(name="Universal Investment", regime="German KVG", src="https://www.universal-investment.com/en/",
        items=[("aua", 1400.0, "EUR", "“administriertes Vermögen von über 1 Billion Euro” (>€1tn AuA; ~€1.39tn mid-2025 per industry data)", 0.75),
               ("headcount", 1700, "count", "“Rund 1.700 Mitarbeitende” (~1,700 employees)", 0.6)]),
    "HSBC T&B": dict(name="HSBC INKA", regime="German KVG", src="https://www.inka-kag.de/wirueberuns/zahlenundfakten",
        items=[("aua", 625.9, "EUR", "“Gesamtes administriertes Volumen: EUR 625,9 MRD.” (total AuA, 30 Apr 2025)", 0.8, "2025-04-30"),
               ("headcount", 300, "count", "“nahezu 300 Spezialisten” (~300 specialists)", 0.6)]),
    # ---- Private / Mutual (US, not on EDGAR as an AM) ----
    # Vanguard is owned by its own funds and runs "at cost" → no parent income statement exists, so
    # revenue/profit are STRUCTURALLY undisclosed (the word "revenue" appears nowhere in its 161-page
    # Form ADV; Form ADV carries no income-statement field by design). The authoritative AuM figure is
    # the SEC Form ADV regulatory AUM (RAUM); the 0.07% asset-weighted expense ratio IS its fee yield.
    "Vanguard": dict(name="Vanguard", regime="Private / Mutual", src="https://reports.adviserinfo.sec.gov/reports/ADV/105958/PDF/105958.pdf",
        items=[("aum_total", 11092.7, "USD", "SEC Form ADV (CRD 105958): regulatory AUM “Total $11,092,665,107,962” (discretionary; valued 31 Dec 2025)", 0.9),
               ("net_flows", 240.0, "USD", "Morningstar US fund-flows 2025: Vanguard ≈$240bn net inflows (2nd-largest fund family, after iShares ≈$366bn)", 0.7, "2025-12-31", "external"),
               ("total_revenue", 7.5, "USD", "ESTIMATE (Vanguard at-cost — no income statement published): ≈0.07% asset-weighted fee × ~$10.7tn avg 2025 AUM ≈ $7.5bn", 0.4, "2025-12-31", "estimate"),
               ("operating_margin", 0.0, "pct", "≈0% by design: Vanguard is owned by its funds and operates at-cost — surplus is returned to investors as lower fees, not booked as operating profit (≈breakeven)", 0.4, "2025-12-31", "estimate"),
               ("effective_fee_rate", 7.0, "bps", "“0.07% Asset-weighted average U.S. mutual fund and ETF expenses” (2025) = its fee yield", 0.85),
               ("headcount", 20000, "count", "“Approximate number of crew (employees) worldwide, as of December 31, 2025 — 20,000”", 0.85)],
        # Coarse asset mix: Vanguard states bond+money-market funds = $2.8tn (31 Dec 2025); equity &
        # balanced is the residual to its $11.09tn RAUM. External basis (Vanguard discloses no clean split).
        breakdowns=[("aum_by_asset_class", "Equity & balanced", 8292.7, "USD", "Residual of $11.09tn RAUM − $2.8tn bond/MMF (Vanguard discloses no equity split)", 0.55, "2025-12-31", "external"),
                    ("aum_by_asset_class", "Fixed income & money market", 2800.0, "USD", "Vanguard: “bond funds and money market funds had $2.8 trillion” (31 Dec 2025)", 0.7, "2025-12-31", "external")]),
    "Fidelity": dict(name="Fidelity Investments", regime="Private / Mutual", src="https://about.fidelity.com/data-and-insights/2025-annual-report",
        items=[("aum_total", 7100.0, "USD", "FY2025 annual report: “MANAGED ASSETS $7.1 trillion” (Up 19% YoY)", 0.9),
               ("aua", 18000.0, "USD", "FY2025 annual report: “ASSETS UNDER ADMINISTRATION $18.0 trillion”", 0.9),
               ("net_flows", 657.3, "USD", "FY2025 annual report: “NET ASSET FLOWS $657.3 billion”", 0.85),
               ("total_revenue", 37.7, "USD", "FY2025 annual report: “REVENUE $37.7 billion (Up 15% YoY)”", 0.9),
               ("operating_income", 12.7, "USD", "FY2025 annual report: “OPERATING INCOME $12.7 billion (Up 24% YoY)”", 0.9),
               ("headcount", 80000, "count", "“over 80,000 associates across 11 countries”", 0.8),
               ("num_countries", 11, "count", "“over 80,000 associates across 11 countries”", 0.8)]),
    "PIMCO": dict(name="PIMCO", regime="Private / Mutual", src="https://www.allianz.com/en/investor_relations/results-reports/results-presentations.html",
        items=[("aum_total", 2260.0, "USD", "$2.26tn total AUM ($1.84tn third-party) at 31 Dec 2025 (PIMCO). Revenue/profit are PIMCO-specific, disclosed in the Allianz FY2025 analyst presentation.", 0.85),
               ("total_revenue", 6.450, "EUR", "Allianz FY2025: “PIMCO (EUR mn) … 6,450” operating revenues", 0.85),
               ("operating_income", 2.593, "EUR", "Allianz FY2025: “PIMCO – OP at EUR 2,593mn, up 3%”", 0.85),
               ("net_flows", 133.2, "EUR", "Allianz FY2025: “3rd party net flows PIMCO: EUR +133bn … +133.2”", 0.85),
               ("mgmt_fee_revenue", 6.159, "EUR", "Allianz FY2025: PIMCO AuM-driven & other revenues €6,159m", 0.8),
               ("performance_fees", 0.290, "EUR", "Allianz FY2025: PIMCO performance fees €290m", 0.8),
               ("headcount", 3100, "count", "PIMCO: “over 3,100 employees working in 22 offices” (pimco.com; Allianz doesn't split AM headcount)", 0.6, "2025-12-31", "external")]),
    # Capital Group (home of the American Funds) is privately/employee-owned — no income statement
    # exists, so revenue/profit/net-flows are structurally undisclosed (NOT FOUND). RAUM + adviser
    # staff come via Form ADV (Capital Research and Management Company, CRD 110885).
    "Capital Group": dict(name="Capital Group", regime="Private / Mutual", src="https://www.capitalgroup.com/about-us.html",
        items=[("aum_total", 3300.0, "USD", "“$3.3T+ … as of December 31, 2025” (Capital Group company facts)", 0.85),
               ("headcount", 9300, "count", "“9,300+ associates” worldwide (31 Dec 2025)", 0.8),
               ("num_countries", 15, "count", "“33 offices in 15 countries”", 0.8)]),
    # ---- US group filers: AM-SEGMENT data (parent group financials are not AM-specific) ----
    "SSgA": dict(name="State Street Global Advisors", regime="US-listed", src="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000093751&type=10-K",
        items=[("aum_total", 5665.0, "USD", "“Total $5,665” (AUM by asset class, 31 Dec 2025; 10-K Table 6)", 0.9),
               ("net_flows", 180.0, "USD", "“Total flows, net … 180” (FY2025; 10-K Table 9)", 0.85),
               ("total_revenue", 2.634, "USD", "Investment Management line-of-business “Total revenue 2,634” ($m FY2025; 10-K Table 14)", 0.9),
               ("mgmt_fee_revenue", 2.398, "USD", "“Management fees $2,398” ($m FY2025)", 0.9),
               ("operating_income", 0.859, "USD", "“Income before income tax expense $859 … Pre-tax margin 33%” ($m FY2025)", 0.9)],
        breakdowns=[("aum_by_asset_class", "Equity", 3589.0, "USD", "SSGA 10-K Table 6: Total equity $3,589bn (31 Dec 2025)", 0.9),
                    ("aum_by_asset_class", "Fixed income", 734.0, "USD", "SSGA 10-K Table 6: Total fixed-income $734bn", 0.9),
                    ("aum_by_asset_class", "Cash", 570.0, "USD", "SSGA 10-K Table 6: Cash $570bn", 0.9),
                    ("aum_by_asset_class", "Multi-asset", 501.0, "USD", "SSGA 10-K Table 6: Multi-asset-class solutions $501bn", 0.9),
                    ("aum_by_asset_class", "Alternatives", 271.0, "USD", "SSGA 10-K Table 6: Alternative investments $271bn (sums to $5,665bn)", 0.9),
                    ("aum_by_region", "Americas", 4155.0, "USD", "SSGA 10-K Table 7: Americas $4,155bn", 0.9),
                    ("aum_by_region", "EMEA", 841.0, "USD", "SSGA 10-K Table 7: EMEA $841bn", 0.9),
                    ("aum_by_region", "Asia-Pacific", 669.0, "USD", "SSGA 10-K Table 7: Asia/Pacific $669bn (sums to $5,665bn)", 0.9)]),
    "JPM": dict(name="J.P. Morgan Asset Management", regime="US-listed", src="https://www.jpmorganchase.com/ir/quarterly-earnings",
        items=[("aum_total", 4791.0, "USD", "“TOTAL ASSETS UNDER MANAGEMENT 4,791” ($bn, AWM, 31 Dec 2025)", 0.9),
               ("net_flows", 209.0, "USD", "AWM long-term AUM net flows $209bn FY2025 (total incl. liquidity $392bn)", 0.85),
               ("total_revenue", 24.073, "USD", "AWM “TOTAL NET REVENUE … 24,073” ($m FY2025)", 0.9),
               ("net_income", 6.522, "USD", "AWM “NET INCOME … 6,522” ($m FY2025, after-tax)", 0.9),
               ("operating_income", 8.644, "USD", "AWM “Income before income tax expense … 8,644” ($m FY2025)", 0.9),
               ("headcount", 29722, "count", "AWM “Employees 29,722” (31 Dec 2025)", 0.85),
               ("num_countries", 35, "count", "J.P. Morgan AM: “portfolio managers, traders … in over 70 locations across 35 countries”", 0.8)],
        breakdowns=[("aum_by_asset_class", "Equity", 1400.0, "USD", "JPM AWM AUM: Equity $1,400bn (31 Dec 2025)", 0.9),
                    ("aum_by_asset_class", "Fixed income", 998.0, "USD", "JPM AWM AUM: Fixed income $998bn", 0.9),
                    ("aum_by_asset_class", "Multi-asset", 884.0, "USD", "JPM AWM AUM: Multi-asset $884bn", 0.9),
                    ("aum_by_asset_class", "Liquidity", 1279.0, "USD", "JPM AWM AUM: Liquidity $1,279bn", 0.9),
                    ("aum_by_asset_class", "Alternatives", 230.0, "USD", "JPM AWM AUM: Alternatives $230bn (sums to $4,791bn)", 0.9)]),
    "Goldman Sachs": dict(name="Goldman Sachs Asset Management", regime="US-listed", src="https://www.goldmansachs.com/investor-relations/financials",
        items=[("aum_total", 3606.0, "USD", "“Total AUS $3,606” ($bn assets under supervision, 31 Dec 2025)", 0.9),
               ("net_flows", 168.0, "USD", "“Total long-term AUS net inflows 168” ($bn FY2025; total AUS net inflows $224bn)", 0.85),
               ("total_revenue", 16.679, "USD", "AWM “Total net revenues 16,679” ($m FY2025)", 0.9),
               ("operating_income", 4.127, "USD", "AWM “Pre-tax earnings $4,127” ($m FY2025; pre-tax margin 25%)", 0.9)],
        breakdowns=[("aum_by_asset_class", "Equity", 951.0, "USD", "GS AUS by asset class: Equity $951bn (31 Dec 2025)", 0.9),
                    ("aum_by_asset_class", "Fixed income", 1334.0, "USD", "GS AUS by asset class: Fixed income $1,334bn", 0.9),
                    ("aum_by_asset_class", "Alternatives", 420.0, "USD", "GS AUS by asset class: Alternative investments $420bn", 0.9),
                    ("aum_by_asset_class", "Liquidity", 901.0, "USD", "GS AUS by asset class: Liquidity products $901bn (sums to $3,606bn)", 0.9)]),
    "UBS": dict(name="UBS Asset Management", regime="European-listed", src="https://www.ubs.com/global/en/investor-relations/financial-information.html",
        items=[("aum_total", 2098.0, "USD", "“Invested assets increased … to USD 2,098bn” (31 Dec 2025)", 0.9),
               ("net_flows", 30.4, "USD", "“Total net new money … 30.4” ($bn FY2025)", 0.85),
               ("total_revenue", 3.156, "USD", "Asset Management “Total revenues … 3,156” ($m FY2025)", 0.9),
               ("operating_income", 0.719, "USD", "Asset Management “operating profit before tax … 719” ($m FY2025)", 0.9),
               ("mgmt_fee_revenue", 2.991, "USD", "UBS AM “Net management fees … 2,991” ($m FY2025)", 0.9),
               ("performance_fees", 0.195, "USD", "UBS AM “Performance fees … 195” ($m FY2025)", 0.9),
               ("num_countries", 22, "count", "“Asset Management … with a presence in 22 countries”", 0.8)],
        breakdowns=[("aum_by_asset_class", "Equities", 904.0, "USD", "UBS AM invested assets: Equities $904bn (31 Dec 2025)", 0.9),
                    ("aum_by_asset_class", "Fixed income", 506.0, "USD", "UBS AM invested assets: Fixed Income $506bn", 0.9),
                    ("aum_by_asset_class", "Multi-asset & solutions", 372.0, "USD", "UBS AM invested assets: Multi-asset & Solutions $372bn", 0.9),
                    ("aum_by_asset_class", "Real estate & private markets", 160.0, "USD", "UBS AM invested assets: Real Estate & Private Markets $160bn", 0.9),
                    ("aum_by_asset_class", "Hedge funds", 62.0, "USD", "UBS AM invested assets: Hedge Fund Businesses $62bn", 0.9),
                    ("aum_by_asset_class", "Associates", 93.0, "USD", "UBS AM invested assets: Associates $93bn (sums to $2,098bn)", 0.85)]),
    "MS": dict(name="Morgan Stanley Investment Management", regime="US-listed", src="https://www.morganstanley.com/about-us-ir",
        items=[("aum_total", 1895.0, "USD", "“Total Assets Under Management or Supervision $1,895” ($bn, 31 Dec 2025)", 0.9),
               ("net_flows", 34.4, "USD", "“Long-term net flows … $34.4” ($bn FY2025)", 0.85),
               ("total_revenue", 6.525, "USD", "Investment Management “Net Revenues $6,525” ($m FY2025)", 0.9),
               ("operating_income", 1.478, "USD", "Investment Management pre-tax income $1,478m FY2025 (“Pre-tax income … $1.5 billion”)", 0.9)],
        breakdowns=[("aum_by_asset_class", "Equity", 314.0, "USD", "MSIM AUM/AUS by asset class: Equity $314bn (31 Dec 2025)", 0.9),
                    ("aum_by_asset_class", "Fixed income", 234.0, "USD", "MSIM AUM/AUS by asset class: Fixed Income $234bn", 0.9),
                    ("aum_by_asset_class", "Alternatives & solutions", 703.0, "USD", "MSIM AUM/AUS by asset class: Alternatives and Solutions $703bn", 0.9),
                    ("aum_by_asset_class", "Liquidity & overlay", 644.0, "USD", "MSIM AUM/AUS by asset class: Liquidity and Overlay Services $644bn (sums to $1,895bn)", 0.9)]),
    "PGIM": dict(name="PGIM (Prudential)", regime="US-listed", src="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001137774&type=10-K",
        items=[("aum_total", 1466.1, "USD", "“Total PGIM assets under management $1,466.1” ($bn, 31 Dec 2025)", 0.9),
               ("net_flows", 2.1, "USD", "“Total third-party flows 2.1” ($bn FY2025; Institutional +6.1, Retail −4.0)", 0.85),
               ("total_revenue", 4.231, "USD", "PGIM segment “Revenues $4,231” ($m FY2025)", 0.9),
               ("operating_income", 0.878, "USD", "PGIM “Adjusted operating income 878” ($m FY2025; pre-tax income $1,010m)", 0.9)],
        breakdowns=[("aum_by_asset_class", "Public fixed income", 902.7, "USD", "PGIM AUM: Public fixed income $902.7bn (31 Dec 2025)", 0.9),
                    ("aum_by_asset_class", "Public equity", 223.1, "USD", "PGIM AUM: Public equity $223.1bn", 0.9),
                    ("aum_by_asset_class", "Real estate", 134.4, "USD", "PGIM AUM: Real estate $134.4bn", 0.9),
                    ("aum_by_asset_class", "Private credit & alternatives", 127.4, "USD", "PGIM AUM: Private credit and other alternatives $127.4bn", 0.9),
                    ("aum_by_asset_class", "Multi-asset", 78.5, "USD", "PGIM AUM: Multi-asset $78.5bn (sums to $1,466.1bn)", 0.9)]),
}


def build(code: str, now_iso: str) -> list[MetricObservation]:
    spec = EUROPE.get(code)
    if not spec:
        return []
    default_period = spec.get("period", "2025-12-31")
    out: list[MetricObservation] = []
    for item in spec["items"]:
        # item = (metric_key, native_value, ccy, quote, conf[, period[, basis]])
        # basis: "reported" (default) | "external" (industry tracker) | "estimate" (transparent model).
        key, native, ccy, quote, conf = item[:5]
        period = item[5] if len(item) > 5 else default_period
        basis = item[6] if len(item) > 6 else "reported"
        if ccy in RAW_UNITS:  # headcount / countries / pct / bps — raw, not money in billions
            unit = RAW_UNITS[ccy]
            value = float(native)
            note = f"{basis} {key.replace('_', ' ')} = {native:,.0f} ({unit})."
            currency = None
        elif key in ("dividends_per_share", "eps_diluted"):  # per-share: FX-convert but DON'T scale
            unit, currency = "USD/shares", "USD"
            value = native * FX[ccy]
            note = f"Native {ccy} {native:,.2f}/share → USD at {FX[ccy]}; basis={basis}."
        else:  # monetary, stated in native billions → USD
            unit, currency = "USD", "USD"
            value = native * FX[ccy] * 1e9
            note = f"Native {ccy} {native:,.1f}bn → USD at {FX[ccy]} (period-end {period}); basis={basis}."
        out.append(MetricObservation(
            competitor_id=code, metric_key=key, value=value, unit=unit, currency=currency,
            period_type="FY", period_end=period, basis=basis,
            definition_note=note, source_doc="results", source_url=spec["src"],
            source_section=quote, confidence=conf,
            extracted_by={"external": "tracker", "estimate": "estimate"}.get(basis, "analyst-eu"),
            extracted_at=now_iso,
        ))
    # Breakdown members (AuM by asset class / region / channel), each reconciling to the firm total.
    for item in spec.get("breakdowns", []):
        # item = (metric_key, member, native_bn, ccy, quote, conf[, period[, basis]])
        key, member, native, ccy, quote, conf = item[:6]
        period = item[6] if len(item) > 6 else default_period
        basis = item[7] if len(item) > 7 else "reported"
        out.append(MetricObservation(
            competitor_id=code, metric_key=key, member=member,
            value=native * FX[ccy] * 1e9, unit="USD", currency="USD",
            period_type="FY", period_end=period, basis=basis,
            definition_note=f"{key.replace('_', ' ')} · {member}: native {ccy} {native:,.1f}bn → USD at {FX[ccy]}; basis={basis}.",
            source_doc="results", source_url=spec["src"], source_section=quote,
            confidence=conf,
            extracted_by={"external": "tracker", "estimate": "estimate"}.get(basis, "analyst-eu"),
            extracted_at=now_iso,
        ))
    return out
