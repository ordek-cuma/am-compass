// Competitor financials — a committed snapshot of the ingestion agent's export
// (spike/out/competitor_ingest/competitor_financials.json). The Financials tab reads this.
// Re-snapshot after re-running the agent: cp spike/out/.../competitor_financials.json here.
import raw from './competitor_financials.json'
import type { FieldStatus } from '../components/facts'

export interface FinMetric {
  value: number | null
  unit: string
  basis: string
  confidence: number
  source: string
  section: string
}
export interface FinDoc {
  name: string
  form: string
  date: string
  fmt: string
  sizeBytes: number
  edgarUrl: string
  file: string // public path, e.g. "filings/BL/blk-20251231.htm"
}
export interface FinBlock {
  name: string
  ticker: string
  regime: string
  cik: string
  period_end: string | null
  documents?: FinDoc[]
  metrics: Record<string, FinMetric>
}
interface FinData {
  generated_at: string
  source: string
  competitors: Record<string, FinBlock>
}

const FIN = raw as unknown as FinData

export const FINANCIALS_SOURCE = FIN.source
export const FINANCIALS_GENERATED = FIN.generated_at

export function financialsFor(code: string): FinBlock | null {
  return FIN.competitors[code] ?? null
}

/** Real crawled filings for a competitor (from the ingestion agent). */
export function documentsFor(code: string): FinDoc[] {
  return FIN.competitors[code]?.documents ?? []
}

export function fmtBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`
  return `${n} B`
}

// Catalogue: groups → metrics (mirrors the agent's metric_catalog).
export const FIN_GROUPS: { group: string; grain: string; items: { key: string; label: string }[] }[] = [
  { group: 'Scale', grain: 'AuM', items: [
    { key: 'aum_total', label: 'Total AuM (end of period)' },
    { key: 'aum_average', label: 'Average AuM' },
    { key: 'aua', label: 'Assets under administration (AuA)' },
  ] },
  { group: 'Flows', grain: 'net new money', items: [
    { key: 'net_flows', label: 'Net new money / net flows' },
    { key: 'organic_growth_rate', label: 'Organic growth rate' },
  ] },
  { group: 'Revenue & fees', grain: 'period', items: [
    { key: 'total_revenue', label: 'Total revenue' },
    { key: 'mgmt_fee_revenue', label: 'Investment management fee revenue' },
    { key: 'performance_fees', label: 'Performance fees' },
    { key: 'effective_fee_rate', label: 'Effective fee rate' },
  ] },
  { group: 'Profitability', grain: 'period', items: [
    { key: 'operating_income', label: 'Operating income' },
    { key: 'operating_margin', label: 'Operating margin' },
    { key: 'net_income', label: 'Net income' },
    { key: 'eps_diluted', label: 'Diluted EPS' },
  ] },
  { group: 'Workforce', grain: 'end of period', items: [
    { key: 'headcount', label: 'Total headcount' },
  ] },
]

export function fmtMetric(m: FinMetric): string {
  const v = m.value
  if (v === null) return '—'
  switch (m.unit) {
    case 'USD': {
      const a = Math.abs(v)
      if (a >= 1e12) return `$${(v / 1e12).toFixed(1)}T`
      if (a >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
      return `$${(v / 1e6).toFixed(0)}M`
    }
    case 'pct': return `${v.toFixed(1)}%`
    case 'bps': return `${v.toFixed(1)} bps`
    case 'USD/shares': return `$${v.toFixed(2)}`
    case 'count': return v.toLocaleString('en-US')
    default: return String(v)
  }
}

// Availability status from provenance: XBRL = green, derived = amber, reported/LLM = by confidence.
export function statusOf(m: FinMetric | undefined): FieldStatus {
  if (!m || m.value === null) return 'add'
  if (m.basis === 'GAAP') return 'have'
  if (m.basis === 'derived') return 'partial'
  return m.confidence >= 0.9 ? 'have' : 'partial'
}
