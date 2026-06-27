// Competitor-intelligence metric taxonomy — mirrors spike/competitor_ingest/schema.py
// METRIC_CATALOG. Drives the 7 category tabs on each competitor. `cut` marks a breakdown
// metric (its observation carries `members`); `derived` = computed; `nonGaap` = adjusted.
export interface MetricDef {
  key: string
  label: string
  unit: string
  cut?: string
  derived?: boolean
  nonGaap?: boolean
}

// Category group values (must match the `group` set in schema.py) → tab label.
export const CATEGORIES = ['Scale', 'Flows', 'Revenue', 'Profitability', 'Workforce', 'Capital', 'Business mix'] as const
export type Category = (typeof CATEGORIES)[number]
export const CATEGORY_LABEL: Record<Category, string> = {
  Scale: 'Scale',
  Flows: 'Flows',
  Revenue: 'Revenue & Fees',
  Profitability: 'Profitability',
  Workforce: 'Workforce',
  Capital: 'Capital',
  'Business mix': 'Business Mix',
}

export const METRICS_BY_CATEGORY: Record<Category, MetricDef[]> = {
  Scale: [
    { key: 'aum_total', label: 'Total AuM (end of period)', unit: 'USD' },
    { key: 'aum_average', label: 'Average AuM', unit: 'USD' },
    { key: 'aua', label: 'Assets under administration (AuA)', unit: 'USD' },
    { key: 'aum_by_asset_class', label: 'AuM by asset class', unit: 'USD', cut: 'asset_class' },
    { key: 'aum_by_vehicle', label: 'AuM by vehicle', unit: 'USD', cut: 'vehicle' },
    { key: 'aum_by_region', label: 'AuM by region / domicile', unit: 'USD', cut: 'region' },
    { key: 'aum_by_channel', label: 'AuM by client channel', unit: 'USD', cut: 'channel' },
    { key: 'aum_by_style', label: 'AuM by management style', unit: 'USD', cut: 'style' },
  ],
  Flows: [
    { key: 'net_flows', label: 'Net new money / net flows', unit: 'USD' },
    { key: 'gross_sales', label: 'Gross sales (inflows)', unit: 'USD' },
    { key: 'redemptions', label: 'Redemptions (outflows)', unit: 'USD' },
    { key: 'organic_growth_rate', label: 'Organic growth rate', unit: 'pct', derived: true },
    { key: 'flows_by_asset_class', label: 'Net flows by asset class', unit: 'USD', cut: 'asset_class' },
    { key: 'flows_by_vehicle', label: 'Net flows by vehicle', unit: 'USD', cut: 'vehicle' },
    { key: 'flows_by_region', label: 'Net flows by region', unit: 'USD', cut: 'region' },
    { key: 'market_impact', label: 'Market / performance impact on AuM', unit: 'USD' },
    { key: 'fx_impact', label: 'FX impact on AuM', unit: 'USD' },
    { key: 'nnr', label: 'Net new revenue (NNR)', unit: 'USD' },
  ],
  Revenue: [
    { key: 'total_revenue', label: 'Total revenue', unit: 'USD' },
    { key: 'mgmt_fee_revenue', label: 'Investment management / advisory fees', unit: 'USD' },
    { key: 'performance_fees', label: 'Performance fees', unit: 'USD' },
    { key: 'performance_fees_pct', label: 'Performance fees % of revenue', unit: 'pct', derived: true },
    { key: 'dist_fee_revenue', label: 'Distribution & servicing fees', unit: 'USD' },
    { key: 'effective_fee_rate', label: 'Effective fee rate / fee yield', unit: 'bps', derived: true },
  ],
  Profitability: [
    { key: 'operating_income', label: 'Operating income', unit: 'USD' },
    { key: 'operating_margin', label: 'Operating margin', unit: 'pct', derived: true },
    { key: 'adj_operating_margin', label: 'Adjusted operating margin', unit: 'pct', nonGaap: true },
    { key: 'net_income', label: 'Net income', unit: 'USD' },
    { key: 'eps_diluted', label: 'Diluted EPS', unit: 'USD/shares' },
    { key: 'comp_expense', label: 'Compensation & benefits', unit: 'USD' },
    { key: 'ga_expense', label: 'General & administrative expense', unit: 'USD' },
    { key: 'total_opex', label: 'Total operating expenses', unit: 'USD' },
    { key: 'comp_ratio', label: 'Compensation ratio', unit: 'pct', derived: true },
    { key: 'cost_income_ratio', label: 'Cost-to-income ratio', unit: 'pct', derived: true },
  ],
  Workforce: [
    { key: 'headcount', label: 'Total headcount / FTEs', unit: 'count' },
    { key: 'investment_professionals', label: 'Investment professionals', unit: 'count' },
    { key: 'aum_per_employee', label: 'AuM per employee', unit: 'USD', derived: true },
    { key: 'revenue_per_employee', label: 'Revenue per employee', unit: 'USD', derived: true },
    { key: 'num_countries', label: 'Countries of operation', unit: 'count' },
    { key: 'num_funds', label: 'Funds / strategies', unit: 'count' },
  ],
  Capital: [
    { key: 'market_cap', label: 'Market capitalization', unit: 'USD' },
    { key: 'pe_ratio', label: 'P/E ratio', unit: 'ratio' },
    { key: 'dividends_per_share', label: 'Dividend per share', unit: 'USD/shares' },
    { key: 'buybacks', label: 'Share buybacks', unit: 'USD' },
    { key: 'solvency_ratio', label: 'Solvency II ratio', unit: 'pct' },
  ],
  'Business mix': [
    { key: 'pct_passive', label: '% passive / index (AuM)', unit: 'pct', derived: true },
    { key: 'pct_alternatives', label: '% alternatives / private markets', unit: 'pct', derived: true },
    { key: 'pct_esg', label: '% ESG / SFDR Art. 8 & 9 AuM', unit: 'pct' },
    { key: 'top_strategy_concentration', label: 'Top-strategy concentration', unit: 'pct' },
  ],
}
