export interface Perf {
  as_of: string | null;
  n_points: number;
  ter_pct: number | null;
  return_1y_net?: number | null;
  return_3y_net?: number | null;
  return_5y_net?: number | null;
  return_si_net?: number | null;
  return_3y_gross?: number | null;
  volatility_ann?: number | null;
  sharpe?: number | null;
  max_drawdown?: number | null;
  tracking_difference_3y?: number | null;
}

export interface DocSummary {
  doc_count?: number;
  by_category?: Record<string, number>;
  latest_annual_report?: string | null;
}

export interface ProductRecord {
  portfolioId: number;
  isin: string | null;
  name: string;
  group: string;
  ter: number | null;
  inception: string | null;
  perf: Perf;
  aum_now: number | null;
  aum_prev: number | null;
  top10_weight: number | null;
  n_holdings: number;
  docs: DocSummary;
  source_xls: string;
}

export interface Signal {
  id: string;
  type: string;
  entity: { portfolioId?: number; isin?: string; name: string };
  before: unknown;
  after: unknown;
  detected_at: string;
  source: string;
  confidence: string;
  method: string;
  note: string;
}

export interface Claim {
  text: string;
  cited_signal_ids: string[];
  confidence: string;
  inferred: boolean;
}

export interface Brief {
  issuer: string;
  n_signals: number;
  n_claims: number;
  uncited_claims: number;
  claims: Claim[];
}

export interface IssuerCoverage {
  issuer: string;
  tier: string;
  product_count: number;
  pct_detail_html: number;
  pct_fund_data_xls: number;
  pct_documents_json: number;
  pct_icloud_dupes: number;
}

export interface Dataset {
  generated_at: string;
  scope: string;
  records: ProductRecord[];
  signals: Signal[];
  brief: Brief;
  inventory: IssuerCoverage[];
}
