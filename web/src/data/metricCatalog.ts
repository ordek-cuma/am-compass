// Competitor-intelligence dashboard taxonomy. Tab organization lives here (data in
// competitor_financials.json is keyed by metric, so this file alone decides what shows where).
export interface MetricDef {
  key: string
  label: string
  unit: string
  cut?: string // breakdown ("by-X") metric — observation carries `members`
  derived?: boolean
  nonGaap?: boolean
  tile?: boolean // headline KPI tile at the top of its tab
}

// Top-level tabs, in order. Scale folded into Overview; Business Mix split into AuM + Revenue.
export const TOP_TABS = [
  'Overview', 'Flows', 'Revenue', 'Profitability', 'Workforce', 'Capital', 'BizmixAuM', 'BizmixRev', 'Strategy',
] as const
export type Tab = (typeof TOP_TABS)[number]
export const TAB_LABEL: Record<Tab, string> = {
  Overview: 'Overview', Flows: 'Flows', Revenue: 'Revenue & Fees', Profitability: 'Profitability',
  Workforce: 'Workforce', Capital: 'Capital', BizmixAuM: 'Business Mix · AuM',
  BizmixRev: 'Business Mix · Revenue', Strategy: 'Strategy & Signals',
}

// Revenue line items (income statement) — used by the detailed Revenue table + the revenue-mix view.
export const REVENUE_LINES: MetricDef[] = [
  { key: 'mgmt_fee_revenue', label: 'Investment management / advisory (base) fees', unit: 'USD' },
  { key: 'performance_fees', label: 'Performance fees', unit: 'USD' },
  { key: 'tech_revenue', label: 'Technology services (Aladdin / eFront)', unit: 'USD' },
  { key: 'dist_fee_revenue', label: 'Distribution & servicing fees', unit: 'USD' },
  { key: 'advisory_other_revenue', label: 'Advisory & other', unit: 'USD' },
  { key: 'total_revenue', label: 'Total revenue', unit: 'USD' },
]

export const METRICS_BY_TAB: Partial<Record<Tab, MetricDef[]>> = {
  Flows: [
    { key: 'net_flows', label: 'Net new money / net flows', unit: 'USD', tile: true },
    { key: 'organic_growth_rate', label: 'Organic growth rate', unit: 'pct', derived: true, tile: true },
    { key: 'gross_sales', label: 'Gross sales (inflows)', unit: 'USD', tile: true },
    { key: 'redemptions', label: 'Redemptions (outflows)', unit: 'USD', tile: true },
    { key: 'market_impact', label: 'Market / performance impact on AuM', unit: 'USD' },
    { key: 'fx_impact', label: 'FX impact on AuM', unit: 'USD' },
    { key: 'nnr', label: 'Net new revenue (NNR)', unit: 'USD' },
    { key: 'flows_by_asset_class', label: 'Net flows by asset class', unit: 'USD', cut: 'asset_class' },
    { key: 'flows_by_region', label: 'Net flows by region', unit: 'USD', cut: 'region' },
  ],
  // Revenue renders as a detailed table (see RevenueTable); tiles surface the headline fees.
  Revenue: [
    { key: 'total_revenue', label: 'Total revenue', unit: 'USD', tile: true },
    { key: 'mgmt_fee_revenue', label: 'Base fees', unit: 'USD', tile: true },
    { key: 'effective_fee_rate', label: 'Effective fee rate', unit: 'bps', derived: true, tile: true },
    { key: 'performance_fees_pct', label: 'Performance fees % of revenue', unit: 'pct', derived: true, tile: true },
  ],
  Profitability: [
    { key: 'operating_margin', label: 'Operating margin (GAAP)', unit: 'pct', derived: true, tile: true },
    { key: 'adj_operating_margin', label: 'Operating margin (adjusted)', unit: 'pct', nonGaap: true, tile: true },
    { key: 'net_income', label: 'Net income', unit: 'USD', tile: true },
    { key: 'eps_diluted', label: 'Diluted EPS', unit: 'USD/shares', tile: true },
  ],
  Workforce: [
    { key: 'headcount', label: 'Total headcount / FTEs', unit: 'count', tile: true },
    { key: 'aum_per_employee', label: 'AuM per employee', unit: 'USD', derived: true, tile: true },
    { key: 'revenue_per_employee', label: 'Revenue per employee', unit: 'USD', derived: true, tile: true },
    { key: 'num_countries', label: 'Countries of operation', unit: 'count', tile: true },
    { key: 'investment_professionals', label: 'Investment professionals', unit: 'count' },
    { key: 'num_funds', label: 'Funds / strategies', unit: 'count' },
    { key: 'ria_employees', label: 'US adviser-entity staff (Form ADV)', unit: 'count' },
  ],
  Capital: [
    { key: 'market_cap', label: 'Market capitalization', unit: 'USD', tile: true },
    { key: 'pe_ratio', label: 'P/E ratio', unit: 'ratio', derived: true, tile: true },
    { key: 'dividends_per_share', label: 'Dividend per share', unit: 'USD/shares', tile: true },
    { key: 'buybacks', label: 'Share buybacks', unit: 'USD', tile: true },
    { key: 'solvency_ratio', label: 'Solvency II ratio', unit: 'pct' },
  ],
  BizmixAuM: [
    { key: 'aum_by_asset_class', label: 'AuM by asset class', unit: 'USD', cut: 'asset_class' },
    { key: 'aum_by_channel', label: 'AuM by client channel', unit: 'USD', cut: 'channel' },
    { key: 'aum_by_region', label: 'AuM by region / domicile', unit: 'USD', cut: 'region' },
  ],
  Strategy: [
    { key: 'pct_passive', label: '% passive / index (AuM)', unit: 'pct', tile: true },
    { key: 'pct_alternatives', label: '% alternatives / private markets', unit: 'pct', derived: true, tile: true },
    { key: 'pct_esg', label: '% ESG / SFDR Art. 8 & 9 AuM', unit: 'pct', tile: true },
    { key: 'top_strategy_concentration', label: 'Top-strategy concentration', unit: 'pct', tile: true },
    { key: 'ma_activity', label: 'M&A activity (AuM acquired)', unit: 'USD' },
  ],
}

// Overview cockpit — headline cross-category KPIs (incl. the old Scale numbers).
export const OVERVIEW_TILES: MetricDef[] = [
  { key: 'aum_total', label: 'Total AuM', unit: 'USD' },
  { key: 'aum_average', label: 'Average AuM', unit: 'USD' },
  { key: 'net_flows', label: 'Net flows', unit: 'USD' },
  { key: 'organic_growth_rate', label: 'Organic growth', unit: 'pct', derived: true },
  { key: 'total_revenue', label: 'Revenue', unit: 'USD' },
  { key: 'operating_margin', label: 'Op margin', unit: 'pct', derived: true },
  { key: 'effective_fee_rate', label: 'Fee yield', unit: 'bps', derived: true },
  { key: 'net_income', label: 'Net income', unit: 'USD' },
  { key: 'pct_passive', label: '% passive', unit: 'pct' },
  { key: 'headcount', label: 'Headcount', unit: 'count' },
  { key: 'raum', label: 'Regulatory AUM (Form ADV)', unit: 'USD' },
]
