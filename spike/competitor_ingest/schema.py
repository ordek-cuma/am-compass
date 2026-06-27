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
    member: str = ""  # breakdown member for a "by-X" metric (e.g. 'Equity', 'EMEA'); "" = firmwide total
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


# The seven competitor-intelligence categories (tab order in the UI).
CATEGORIES: list[str] = ["Scale", "Flows", "Revenue", "Profitability", "Workforce", "Capital", "Business mix"]

# Canonical metric catalogue: metric_key -> dict(label, unit, group, definition, ...).
#   xbrl=[...]     us-gaap concept(s) that satisfy the metric deterministically (automated)
#   derived=True   computed downstream from other metrics (derive.py), never extracted
#   cut="..."      this is a breakdown metric; observations carry a `member`; `members` = display order
#   non_gaap=True  firms report a non-GAAP/adjusted version
METRIC_CATALOG: dict[str, dict] = {
    # ============ Scale — AuM and asset base ============
    "aum_total": dict(label="Total AuM (end of period)", unit="USD", group="Scale",
                      definition="Total assets under management at period end.", xbrl=[]),
    "aum_average": dict(label="Average AuM", unit="USD", group="Scale",
                        definition="Average AuM over the period (the base fees are earned on).", xbrl=[]),
    "aua": dict(label="Assets under administration (AuA)", unit="USD", group="Scale",
                definition="Assets serviced/administered (Master-/Service-KVG) — NOT managed; not comparable to AuM.", xbrl=[]),
    "aum_by_asset_class": dict(label="AuM by asset class", unit="USD", group="Scale", xbrl=[], cut="asset_class",
                               members=["Equity", "Fixed income", "Multi-asset", "Money market", "Alternatives", "Real assets / RE"],
                               definition="AuM split by asset class."),
    "aum_by_vehicle": dict(label="AuM by vehicle", unit="USD", group="Scale", xbrl=[], cut="vehicle",
                           members=["Mutual funds", "ETFs", "SMAs / mandates", "Commingled", "Alternatives"],
                           definition="AuM split by product vehicle."),
    "aum_by_region": dict(label="AuM by region / domicile", unit="USD", group="Scale", xbrl=[], cut="region",
                          members=["Americas", "EMEA", "APAC"], definition="AuM split by client region / domicile."),
    "aum_by_channel": dict(label="AuM by client channel", unit="USD", group="Scale", xbrl=[], cut="channel",
                           members=["Institutional", "Retail / intermediary", "Wealth", "Insurance-affiliated"],
                           definition="AuM split by client channel."),
    "aum_by_style": dict(label="AuM by management style", unit="USD", group="Scale", xbrl=[], cut="style",
                         members=["Active", "Index / passive", "ETF"], definition="AuM split by active vs passive/index."),

    # ============ Flows and organic growth ============
    "net_flows": dict(label="Net new money / net flows", unit="USD", group="Flows",
                      definition="Net new client money for the period (inflows minus outflows).", xbrl=[]),
    "gross_sales": dict(label="Gross sales (inflows)", unit="USD", group="Flows",
                        definition="Gross client inflows for the period.", xbrl=[]),
    "redemptions": dict(label="Redemptions (outflows)", unit="USD", group="Flows",
                        definition="Gross client outflows for the period.", xbrl=[]),
    "flows_by_asset_class": dict(label="Net flows by asset class", unit="USD", group="Flows", xbrl=[], cut="asset_class",
                                 members=["Equity", "Fixed income", "Multi-asset", "Money market", "Alternatives", "Real assets / RE"],
                                 definition="Net flows split by asset class."),
    "flows_by_vehicle": dict(label="Net flows by vehicle", unit="USD", group="Flows", xbrl=[], cut="vehicle",
                             members=["Mutual funds", "ETFs", "SMAs / mandates", "Commingled", "Alternatives"],
                             definition="Net flows split by vehicle."),
    "flows_by_region": dict(label="Net flows by region", unit="USD", group="Flows", xbrl=[], cut="region",
                            members=["Americas", "EMEA", "APAC"], definition="Net flows split by region."),
    "organic_growth_rate": dict(label="Organic growth rate", unit="pct", group="Flows",
                                definition="net_flows / opening AuM, annualized.", xbrl=[], derived=True),
    "market_impact": dict(label="Market / performance impact on AuM", unit="USD", group="Flows",
                          definition="Change in AuM from market movement & investment performance.", xbrl=[]),
    "fx_impact": dict(label="FX impact on AuM", unit="USD", group="Flows",
                      definition="Change in AuM from currency translation.", xbrl=[]),
    "nnr": dict(label="Net new revenue (NNR)", unit="USD", group="Flows",
                definition="Annualized base-fee revenue won/lost from net flows (≠ NNM: low-fee passive adds less).", xbrl=[]),

    # ============ Revenue and fees ============
    "total_revenue": dict(label="Total revenue", unit="USD", group="Revenue",
                          definition="Total net revenue for the period.",
                          # NB: ...IncludingAssessedTax is NOT in this default list on purpose — for some
                          # filers (e.g. AllianceBernstein) it's only the customer-contract subset, while
                          # "Revenues" is the true total (incl. investment gains/interest). Firms that tag
                          # total revenue ONLY as IncludingAssessedTax (e.g. Janus Henderson) get it via a
                          # per-firm override in extract_xbrl.CONCEPT_OVERRIDES.
                          xbrl=["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues"]),
    "mgmt_fee_revenue": dict(label="Investment management / advisory fees", unit="USD", group="Revenue",
                             definition="Advisory/management (base) fee revenue, excl. performance fees.", xbrl=[]),
    "performance_fees": dict(label="Performance fees", unit="USD", group="Revenue",
                             definition="Performance/incentive fee revenue.", xbrl=[]),
    "performance_fees_pct": dict(label="Performance fees % of revenue", unit="pct", group="Revenue",
                                 definition="performance_fees / total_revenue.", xbrl=[], derived=True),
    "dist_fee_revenue": dict(label="Distribution & servicing fees", unit="USD", group="Revenue",
                             definition="Distribution and shareholder-servicing fee revenue.", xbrl=[]),
    "effective_fee_rate": dict(label="Effective fee rate / fee yield", unit="bps", group="Revenue",
                               definition="mgmt_fee_revenue / average AuM (bps). The margin-compression story.", xbrl=[], derived=True),

    # ============ Profitability and efficiency ============
    "operating_income": dict(label="Operating income", unit="USD", group="Profitability",
                            definition="Operating income (loss).", xbrl=["OperatingIncomeLoss"]),
    "operating_margin": dict(label="Operating margin", unit="pct", group="Profitability",
                             definition="operating_income / total_revenue.", xbrl=[], derived=True),
    "adj_operating_margin": dict(label="Adjusted operating margin", unit="pct", group="Profitability", non_gaap=True,
                                 definition="Firm's reported non-GAAP/economic operating margin.", xbrl=[]),
    "net_income": dict(label="Net income", unit="USD", group="Profitability",
                       definition="Net income attributable to the company.", xbrl=["NetIncomeLoss", "ProfitLoss"]),
    "eps_diluted": dict(label="Diluted EPS", unit="USD/shares", group="Profitability",
                        definition="Diluted earnings per share.", xbrl=["EarningsPerShareDiluted"]),
    "comp_expense": dict(label="Compensation & benefits", unit="USD", group="Profitability",
                         definition="Employee compensation & benefits expense.",
                         xbrl=["LaborAndRelatedExpense", "EmployeeBenefitsAndShareBasedCompensation"]),
    "ga_expense": dict(label="General & administrative expense", unit="USD", group="Profitability",
                       definition="G&A expense.", xbrl=["GeneralAndAdministrativeExpense"]),
    "total_opex": dict(label="Total operating expenses", unit="USD", group="Profitability",
                       definition="Total operating expenses.", xbrl=["OperatingExpenses", "CostsAndExpenses", "BenefitsLossesAndExpenses"]),
    "comp_ratio": dict(label="Compensation ratio", unit="pct", group="Profitability",
                       definition="comp_expense / total_revenue.", xbrl=[], derived=True),
    "cost_income_ratio": dict(label="Cost-to-income ratio", unit="pct", group="Profitability",
                              definition="total_opex / total_revenue.", xbrl=[], derived=True),

    # ============ Workforce and operating footprint ============
    "headcount": dict(label="Total headcount / FTEs", unit="count", group="Workforce",
                      definition="Total employees / FTEs at period end.", xbrl=[]),
    "investment_professionals": dict(label="Investment professionals", unit="count", group="Workforce",
                                     definition="Number of investment professionals.", xbrl=[]),
    "aum_per_employee": dict(label="AuM per employee", unit="USD", group="Workforce",
                             definition="aum_total / headcount (productivity).", xbrl=[], derived=True),
    "revenue_per_employee": dict(label="Revenue per employee", unit="USD", group="Workforce",
                                 definition="total_revenue / headcount (productivity).", xbrl=[], derived=True),
    "num_countries": dict(label="Countries of operation", unit="count", group="Workforce",
                          definition="Number of countries the firm operates in.", xbrl=[]),
    "num_funds": dict(label="Funds / strategies", unit="count", group="Workforce",
                      definition="Firm-level count of funds / strategies / share classes.", xbrl=[]),

    # ============ Capital and financial strength ============
    "market_cap": dict(label="Market capitalization", unit="USD", group="Capital",
                       definition="Equity market capitalization (listed).", xbrl=[]),
    "pe_ratio": dict(label="P/E ratio", unit="ratio", group="Capital",
                     definition="Price / earnings (listed).", xbrl=[]),
    "dividends_per_share": dict(label="Dividend per share", unit="USD/shares", group="Capital",
                                definition="Declared dividend per share.", xbrl=["CommonStockDividendsPerShareDeclared"]),
    "buybacks": dict(label="Share buybacks", unit="USD", group="Capital",
                     definition="Share repurchases during the period.", xbrl=["PaymentsForRepurchaseOfCommonStock"]),
    "solvency_ratio": dict(label="Solvency II ratio", unit="pct", group="Capital",
                           definition="Group Solvency II ratio (insurer-owned).", xbrl=[]),

    # ============ Business-mix / strategic ratios ============
    "pct_passive": dict(label="% passive / index (AuM)", unit="pct", group="Business mix",
                        definition="Index+ETF AuM / total AuM.", xbrl=[], derived=True),
    "pct_alternatives": dict(label="% alternatives / private markets", unit="pct", group="Business mix",
                             definition="Alternatives AuM / total AuM (the margin driver).", xbrl=[], derived=True),
    "pct_esg": dict(label="% ESG / SFDR Art. 8 & 9 AuM", unit="pct", group="Business mix",
                    definition="ESG / SFDR Article 8 & 9 AuM as % of total.", xbrl=[]),
    "top_strategy_concentration": dict(label="Top-strategy concentration", unit="pct", group="Business mix",
                                       definition="% AuM in the largest funds/strategies.", xbrl=[]),
}
