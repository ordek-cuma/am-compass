// Competitor-intelligence dashboard taxonomy. Tab/category organization lives here (the data
// in competitor_financials.json is keyed by metric, so this file alone decides what shows where).
export interface MetricDef {
  key: string
  label: string
  unit: string
  cut?: string // breakdown ("by-X") metric — observation carries `members`
  derived?: boolean
  nonGaap?: boolean
  tile?: boolean // surfaced as a headline KPI tile at the top of its tab
}

// Top-level tabs, in order. 'Overview' is a curated cockpit; 'Business mix' has sub-segments.
export const TOP_TABS = [
  'Overview', 'Scale', 'Flows', 'Revenue', 'Profitability', 'Workforce', 'Capital', 'Business mix', 'Strategy',
] as const
export type Tab = (typeof TOP_TABS)[number]
export const TAB_LABEL: Record<Tab, string> = {
  Overview: 'Overview', Scale: 'Scale', Flows: 'Flows', Revenue: 'Revenue & Fees',
  Profitability: 'Profitability', Workforce: 'Workforce', Capital: 'Capital',
  'Business mix': 'Business Mix', Strategy: 'Strategy & Signals',
}

// Metrics per standard tab (Overview + Business mix handled separately below).
export const METRICS_BY_TAB: Partial<Record<Tab, MetricDef[]>> = {
  Scale: [
    { key: 'aum_total', label: 'Total AuM (end of period)', unit: 'USD', tile: true },
    { key: 'aum_average', label: 'Average AuM', unit: 'USD', tile: true },
    { key: 'aua', label: 'Assets under administration (AuA)', unit: 'USD', tile: true },
  ],
  Flows: [
    { key: 'net_flows', label: 'Net new money / net flows', unit: 'USD', tile: true },
    { key: 'organic_growth_rate', label: 'Organic growth rate', unit: 'pct', derived: true, tile: true },
    { key: 'gross_sales', label: 'Gross sales (inflows)', unit: 'USD', tile: true },
    { key: 'redemptions', label: 'Redemptions (outflows)', unit: 'USD', tile: true },
    { key: 'market_impact', label: 'Market / performance impact on AuM', unit: 'USD' },
    { key: 'fx_impact', label: 'FX impact on AuM', unit: 'USD' },
    { key: 'nnr', label: 'Net new revenue (NNR)', unit: 'USD' },
    { key: 'flows_by_asset_class', label: 'Net flows by asset class', unit: 'USD', cut: 'asset_class' },
    { key: 'flows_by_vehicle', label: 'Net flows by vehicle', unit: 'USD', cut: 'vehicle' },
    { key: 'flows_by_region', label: 'Net flows by region', unit: 'USD', cut: 'region' },
  ],
  Revenue: [
    { key: 'total_revenue', label: 'Total revenue', unit: 'USD', tile: true },
    { key: 'mgmt_fee_revenue', label: 'Investment management / advisory fees', unit: 'USD', tile: true },
    { key: 'performance_fees', label: 'Performance fees', unit: 'USD', tile: true },
    { key: 'effective_fee_rate', label: 'Effective fee rate / fee yield', unit: 'bps', derived: true, tile: true },
    { key: 'performance_fees_pct', label: 'Performance fees % of revenue', unit: 'pct', derived: true },
    { key: 'dist_fee_revenue', label: 'Distribution & servicing fees', unit: 'USD' },
  ],
  // Profitability renders as a P&L table (see PnLTable); tiles still surface the key margins.
  Profitability: [
    { key: 'operating_margin', label: 'Operating margin (GAAP)', unit: 'pct', derived: true, tile: true },
    { key: 'adj_operating_margin', label: 'Operating margin (adjusted)', unit: 'pct', nonGaap: true, tile: true },
    { key: 'net_income', label: 'Net income', unit: 'USD', tile: true },
    { key: 'eps_diluted', label: 'Diluted EPS', unit: 'USD/shares', tile: true },
    { key: 'total_revenue', label: 'Total revenue', unit: 'USD' },
    { key: 'comp_expense', label: 'Compensation & benefits', unit: 'USD' },
    { key: 'ga_expense', label: 'General & administrative expense', unit: 'USD' },
    { key: 'total_opex', label: 'Total operating expenses', unit: 'USD' },
    { key: 'operating_income', label: 'Operating income', unit: 'USD' },
    { key: 'comp_ratio', label: 'Compensation ratio', unit: 'pct', derived: true },
    { key: 'cost_income_ratio', label: 'Cost-to-income ratio', unit: 'pct', derived: true },
  ],
  Workforce: [
    { key: 'headcount', label: 'Total headcount / FTEs', unit: 'count', tile: true },
    { key: 'investment_professionals', label: 'Investment professionals', unit: 'count', tile: true },
    { key: 'aum_per_employee', label: 'AuM per employee', unit: 'USD', derived: true, tile: true },
    { key: 'revenue_per_employee', label: 'Revenue per employee', unit: 'USD', derived: true, tile: true },
    { key: 'num_countries', label: 'Countries of operation', unit: 'count' },
    { key: 'num_funds', label: 'Funds / strategies', unit: 'count' },
  ],
  Capital: [
    { key: 'market_cap', label: 'Market capitalization', unit: 'USD', tile: true },
    { key: 'pe_ratio', label: 'P/E ratio', unit: 'ratio', tile: true },
    { key: 'dividends_per_share', label: 'Dividend per share', unit: 'USD/shares', tile: true },
    { key: 'buybacks', label: 'Share buybacks', unit: 'USD', tile: true },
    { key: 'solvency_ratio', label: 'Solvency II ratio', unit: 'pct' },
  ],
  Strategy: [
    { key: 'pct_passive', label: '% passive / index (AuM)', unit: 'pct', derived: true, tile: true },
    { key: 'pct_alternatives', label: '% alternatives / private markets', unit: 'pct', derived: true, tile: true },
    { key: 'pct_esg', label: '% ESG / SFDR Art. 8 & 9 AuM', unit: 'pct', tile: true },
    { key: 'top_strategy_concentration', label: 'Top-strategy concentration', unit: 'pct', tile: true },
    { key: 'ma_activity', label: 'M&A activity (AuM acquired)', unit: 'USD' },
  ],
}

// Business Mix sub-segments (one toggle inside the Business Mix tab).
export const BIZMIX_SUBSEGS = ['AuM', 'Revenue', 'AuA'] as const
export type BizmixSeg = (typeof BIZMIX_SUBSEGS)[number]
export const BIZMIX_METRICS: Record<BizmixSeg, MetricDef[]> = {
  AuM: [
    { key: 'aum_by_asset_class', label: 'AuM by asset class', unit: 'USD', cut: 'asset_class' },
    { key: 'aum_by_vehicle', label: 'AuM by vehicle / product', unit: 'USD', cut: 'vehicle' },
    { key: 'aum_by_style', label: 'AuM by style (active / passive)', unit: 'USD', cut: 'style' },
    { key: 'aum_by_region', label: 'AuM by region / domicile', unit: 'USD', cut: 'region' },
    { key: 'aum_by_channel', label: 'AuM by client channel', unit: 'USD', cut: 'channel' },
  ],
  Revenue: [
    { key: 'mgmt_fee_revenue', label: 'Investment management / advisory fees', unit: 'USD' },
    { key: 'performance_fees', label: 'Performance fees', unit: 'USD' },
    { key: 'tech_revenue', label: 'Technology services (Aladdin / eFront)', unit: 'USD' },
    { key: 'dist_fee_revenue', label: 'Distribution & servicing fees', unit: 'USD' },
    { key: 'advisory_other_revenue', label: 'Advisory & other', unit: 'USD' },
  ],
  AuA: [
    { key: 'aua', label: 'Assets under administration (AuA)', unit: 'USD' },
    { key: 'aua_by_service', label: 'AuA by service', unit: 'USD', cut: 'service' },
  ],
}

// Overview cockpit — the headline cross-category KPIs.
export const OVERVIEW_TILES: MetricDef[] = [
  { key: 'aum_total', label: 'Total AuM', unit: 'USD' },
  { key: 'net_flows', label: 'Net flows', unit: 'USD' },
  { key: 'organic_growth_rate', label: 'Organic growth', unit: 'pct', derived: true },
  { key: 'total_revenue', label: 'Revenue', unit: 'USD' },
  { key: 'operating_margin', label: 'Op margin', unit: 'pct', derived: true },
  { key: 'effective_fee_rate', label: 'Fee yield', unit: 'bps', derived: true },
  { key: 'net_income', label: 'Net income', unit: 'USD' },
  { key: 'headcount', label: 'Headcount', unit: 'count' },
]
