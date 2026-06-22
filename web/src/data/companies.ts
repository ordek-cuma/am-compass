// Competitor Data Room — the deep-dive home for the players the Radar watches.
// Entities ARE the 32 competitors (from competitors.ts); each carries a category-appropriate
// document set that mirrors the first agent's document taxonomy (10-K/URD/ADV/Jahresbericht…).
// These docs are representative placeholders until the ingestion agent fetches the real files.
import { COMPETITORS } from './competitors'
import type { Category } from './competitors'
import type { Company, CompanyDoc, CompanyRow, FacetMap } from './types'

// Per disclosure-regime document templates: [category, doc, fmt, size]
const DOCS_BY_REGIME: Record<Category, [string, string, string, string][]> = {
  'US-listed': [
    ['Financials', 'Annual Report (10-K)', 'PDF', '5.8 MB'],
    ['Financials', 'Q4 Earnings Release', 'PDF', '680 KB'],
    ['Financials', 'Earnings Presentation', 'PDF', '2.2 MB'],
    ['Regulatory', 'Form ADV (Part 1 + 2A)', 'PDF', '1.1 MB'],
    ['ESG', 'Sustainability Report', 'PDF', '3.4 MB'],
  ],
  'European-listed': [
    ['Financials', 'Universal Registration Document', 'PDF', '7.9 MB'],
    ['Financials', 'Half-Year Report', 'PDF', '2.6 MB'],
    ['Financials', 'Earnings Presentation', 'PDF', '2.1 MB'],
    ['ESG', 'SFDR / Sustainability Report', 'PDF', '3.0 MB'],
    ['Press', 'Press Release', 'PDF', '180 KB'],
  ],
  'Private / Mutual': [
    ['Regulatory', 'Form ADV (Part 1 + 2A)', 'PDF', '1.3 MB'],
    ['Fund', 'Fund Annual Report', 'PDF', '4.2 MB'],
    ['Fund', 'Prospectus', 'PDF', '2.8 MB'],
    ['Fund', 'Factsheet', 'PDF', '420 KB'],
    ['Press', 'Press Release', 'PDF', '160 KB'],
  ],
  'German KVG': [
    ['Fund', 'Jahresbericht (Fund Annual Report)', 'PDF', '4.6 MB'],
    ['Regulatory', 'Bundesanzeiger Filing', 'PDF', '900 KB'],
    ['Platform', 'Master-/Service-KVG Brochure', 'PDF', '1.2 MB'],
    ['Fund', 'Factsheet / KID', 'PDF', '380 KB'],
    ['Press', 'Press Release', 'PDF', '170 KB'],
  ],
}

const DATES = ['2026-06-04', '2026-05-21', '2026-04-30', '2026-03-17', '2026-02-12', '2026-01-28', '2025-12-09', '2025-11-15']

const COUNTRY: Record<string, string> = { US: 'United States', DE: 'Germany', FR: 'France', CH: 'Switzerland', UK: 'United Kingdom' }
function countryOf(hq: string): string {
  const code = hq.split(' / ')[0].split(', ').pop()?.trim() ?? ''
  return COUNTRY[code] ?? code
}

export const COMPANIES: Company[] = COMPETITORS.map((c, ci) => {
  const docs: CompanyDoc[] = DOCS_BY_REGIME[c.category].map((t, j) => ({
    cat: t[0],
    doc: t[1],
    fmt: t[2],
    sz: t[3],
    date: DATES[(ci + j) % DATES.length],
  }))
  return {
    co: c.name,
    seg: c.focus,
    country: countryOf(c.hq),
    tick: c.code,
    docs,
    region: c.region,
    owner: c.owner,
    regime: c.category,
    website: c.website,
  }
})

export function companyRows(): CompanyRow[] {
  const r: CompanyRow[] = []
  COMPANIES.forEach((c) =>
    c.docs.forEach((d) => r.push({ co: c.co, seg: c.seg, cat: d.cat, doc: d.doc, fmt: d.fmt, date: d.date, sz: d.sz })),
  )
  return r
}

const uniq = (xs: string[]) => [...new Set(xs)]

export const CFACETS: FacetMap = {
  co: ['Competitor', ...COMPANIES.map((c) => c.co)],
  seg: ['Focus', ...uniq(COMPANIES.map((c) => c.seg))],
  cat: ['Category', 'Financials', 'Regulatory', 'ESG', 'Fund', 'Platform', 'Press'],
  fmt: ['Format', 'PDF', 'DOCX', 'XLSX', 'CSV', 'ZIP'],
  yr: ['Year', '2026', '2025'],
}
