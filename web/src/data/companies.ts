// Company Data Room sample data — issuers + their documents.
// Grain in the list view is one row per (company, document).
import type { Company, CompanyDoc, CompanyRow, FacetMap } from './types'

const COMPANY_META: [string, string, string, string][] = [
  ['Apple Inc.', 'Technology', 'United States', 'AAPL'],
  ['Microsoft Corporation', 'Technology', 'United States', 'MSFT'],
  ['NVIDIA Corporation', 'Technology', 'United States', 'NVDA'],
  ['JPMorgan Chase & Co.', 'Financials', 'United States', 'JPM'],
  ['HSBC Holdings plc', 'Financials', 'United Kingdom', 'HSBA'],
  ['Nestlé S.A.', 'Consumer Staples', 'Switzerland', 'NESN'],
  ['Shell plc', 'Energy', 'United Kingdom', 'SHEL'],
  ['Siemens AG', 'Industrials', 'Germany', 'SIE'],
  ['Novo Nordisk A/S', 'Health Care', 'Denmark', 'NOVO B'],
  ['Toyota Motor Corporation', 'Consumer Discretionary', 'Japan', '7203'],
]

const DOCT: [string, string, string, string][] = [
  ['Financials', 'Annual Report', 'PDF', '6.4 MB'],
  ['Research', 'Equity Research Note', 'PDF', '820 KB'],
  ['ESG', 'Sustainability Report', 'PDF', '3.1 MB'],
  ['Engagement', 'Engagement Summary', 'DOCX', '240 KB'],
  ['Governance', 'Proxy Voting Record', 'CSV', '64 KB'],
  ['Financials', 'Quarterly Results', 'XLSX', '1.1 MB'],
  ['Onboarding', 'KYC / Onboarding Pack', 'ZIP', '12 MB'],
  ['Legal', 'Master Services Agreement', 'PDF', '1.4 MB'],
]

const DATES = ['2026-06-04', '2026-05-21', '2026-04-30', '2026-03-17', '2026-02-12', '2026-01-28', '2025-12-09', '2025-11-15']

export const COMPANIES: Company[] = COMPANY_META.map((m, ci) => {
  const count = 4 + (ci % 3)
  const docs: CompanyDoc[] = []
  for (let j = 0; j < count; j++) {
    const tpl = DOCT[(ci + j) % DOCT.length]
    docs.push({ cat: tpl[0], doc: tpl[1], fmt: tpl[2], sz: tpl[3], date: DATES[(ci * 2 + j) % DATES.length] })
  }
  return { co: m[0], seg: m[1], country: m[2], tick: m[3], docs }
})

export function companyRows(): CompanyRow[] {
  const r: CompanyRow[] = []
  COMPANIES.forEach((c) =>
    c.docs.forEach((d) => r.push({ co: c.co, seg: c.seg, cat: d.cat, doc: d.doc, fmt: d.fmt, date: d.date, sz: d.sz })),
  )
  return r
}

export const CFACETS: FacetMap = {
  co: ['Company', ...COMPANY_META.map((m) => m[0])],
  seg: ['Segment', 'Technology', 'Financials', 'Consumer Staples', 'Energy', 'Industrials', 'Health Care', 'Consumer Discretionary'],
  cat: ['Category', 'Financials', 'Research', 'ESG', 'Engagement', 'Governance', 'Onboarding', 'Legal'],
  fmt: ['Format', 'PDF', 'DOCX', 'XLSX', 'CSV', 'ZIP'],
  yr: ['Year', '2026', '2025'],
}
