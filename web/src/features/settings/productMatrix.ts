// Shared model for the Product Coverage (confidence) and Product Fetcher (source) matrices.
// Both render the same competitor × product-type/group grid over the Product Data Room catalogue;
// this module holds the columns, the confidence grading, and the source playbook.
import { COMPANIES } from '../../data/companies'
import { productsForCompetitor, type Product } from '../../data/products'

export type Status = 'green' | 'orange' | 'red'
type Kind = 'total' | 'vehicle' | 'ac'
export type Col = { key: string; label: string; kind: Kind; val?: string }

// Columns: product TYPES (vehicle) then product GROUPS (asset class).
export const COLUMNS: Col[] = [
  { key: 'total', label: 'Products', kind: 'total' },
  { key: 'etf', label: 'ETFs', kind: 'vehicle', val: 'ETF' },
  { key: 'mf', label: 'Mutual Funds', kind: 'vehicle', val: 'Mutual Fund' },
  { key: 'mmf', label: 'Money Mkt', kind: 'vehicle', val: 'Money Market Fund' },
  { key: 'eq', label: 'Equity', kind: 'ac', val: 'Equity' },
  { key: 'fi', label: 'Fixed Income', kind: 'ac', val: 'Fixed Income' },
  { key: 'ma', label: 'Multi-Asset', kind: 'ac', val: 'Multi Asset' },
  { key: 'co', label: 'Commodity', kind: 'ac', val: 'Commodity' },
  { key: 're', label: 'Real Estate', kind: 'ac', val: 'Real Estate' },
]

export const COLOR: Record<Status, string> = { green: '#1f9d76', orange: '#d68a2c', red: '#cf6a63' }

// Coverage model. The matrix grades how complete our PRODUCT COVERAGE is for each competitor —
// whether we hold the competitor's product range — NOT the raw product count. A manager that
// genuinely offers only one or two funds in a category is still FULLY COVERED (green); the cell
// number conveys the magnitude (0 = they offer none of that type). Colour tiers:
//   green  = covered — the competitor's publicly-available range is ingested
//   amber  = partially ingested — we knowingly hold only part of the public range
//   red    = not ingested — no data captured for this competitor yet
// This is why thin lines are no longer amber: "few products" is not "incomplete coverage". To
// flag a competitor as genuinely partial (re-surfacing amber/red by count), add its code to
// PARTIAL. CONFIRMED_NONE = competitors verified to issue no own products (e.g. a Master-KVG) —
// their empty cells are a confirmed green, not a gap.
const PARTIAL = new Set<string>([])
const CONFIRMED_NONE = new Set<string>(['Universal Invest.'])

export type Tier = 'full' | 'partial' | 'none'

function count(prods: Product[], col: Col): number {
  if (col.kind === 'total') return prods.length
  if (col.kind === 'vehicle') return prods.filter((p) => p.vehicle === col.val).length
  return prods.filter((p) => p.assetClass === col.val).length
}

function grade(n: number, col: Col, tier: Tier): Status {
  if (tier === 'full') return 'green' // covered — count shown; 0 = confirmed none
  if (tier === 'none') return 'red' // not ingested at all
  // partial: surface the gap by count
  if (n === 0) return 'red'
  if (col.kind === 'total') return n >= 20 ? 'green' : 'orange'
  return n >= 5 ? 'green' : 'orange'
}

// ── Source playbook ─────────────────────────────────────────────────────────────
export type SrcKey = 'sa' | 'ms' | 'jetf' | 'fin' | 'centre' | 'filings' | 'na'
export const SRC: Record<SrcKey, { label: string; color: string }> = {
  sa: { label: 'stockanalysis', color: '#2f6fb0' },
  ms: { label: 'Morningstar', color: '#7a52b3' },
  jetf: { label: 'justETF', color: '#1f9d76' },
  fin: { label: 'finanzen.net', color: '#c08a23' },
  centre: { label: 'fund centre / site', color: '#3b8a8a' },
  filings: { label: 'SEC / BX filings', color: '#b5645e' },
  na: { label: 'n/a — no products', color: '#7b8190' },
}

type Prof = { primary: SrcKey; etf?: SrcKey; mf?: SrcKey; mmf?: SrcKey; co?: SrcKey; note: string }
const SA_NOTE = 'stockanalysis.com — ETF screener + per-ticker quote; full mutual-fund + MMF universe (MMF totals backfilled from Morningstar)'
const usSa = (codes: string[]): Record<string, Prof> =>
  Object.fromEntries(codes.map((c) => [c, { primary: 'sa', note: SA_NOTE } as Prof]))

const SRC_BY_CODE: Record<string, Prof> = {
  ...usSa(['BL', 'Vanguard', 'Fidelity', 'AB', 'PIMCO', 'Capital Group', 'AMG', 'FED', 'FT', 'JH', 'JPM', 'MS', 'PGIM', 'TROW', 'Goldman Sachs']),
  SSgA: { primary: 'sa', mmf: 'centre', note: 'stockanalysis.com for SPDR ETFs/funds; money-market totals from ssga.com fund pages' },
  IVZ: { primary: 'sa', mmf: 'centre', note: 'stockanalysis.com for Invesco ETFs/funds; money-market totals from invesco.com' },
  WisdomTree: { primary: 'sa', co: 'centre', note: 'US ETPs from stockanalysis.com; EU ETC / ETP / UCITS range from the wisdomtree.eu Product-AUM table' },
  AMU: { primary: 'fin', etf: 'jetf', note: 'UCITS ETFs via justETF; mutual funds via finanzen.net' },
  DWS: { primary: 'fin', etf: 'jetf', note: 'Xtrackers ETFs via justETF; funds via finanzen.net' },
  UBS: { primary: 'fin', etf: 'jetf', note: 'UCITS ETFs via justETF; funds via finanzen.net' },
  DEKA: { primary: 'fin', etf: 'jetf', note: 'Deka ETFs via justETF; funds via finanzen.net' },
  AGI: { primary: 'fin', etf: 'jetf', note: 'Allianz GI funds via finanzen.net; nascent active-ETF range via justETF' },
  Schroders: { primary: 'fin', etf: 'jetf', note: 'Schroders funds via finanzen.net; IG Corp Bond ETF via justETF' },
  abrdn: { primary: 'fin', etf: 'jetf', note: 'abrdn funds via finanzen.net; ETFs via justETF' },
  MandG: { primary: 'fin', note: 'M&G funds via finanzen.net' },
  NAT: { primary: 'fin', note: 'Natixis / affiliate funds via finanzen.net' },
  Union: { primary: 'fin', note: 'Union Investment funds via finanzen.net' },
  'Swiss Life AM': { primary: 'fin', note: 'Swiss Life funds via finanzen.net / swisslife-am.com' },
  MEAG: { primary: 'fin', note: 'MEAG funds via finanzen.net / meag.com' },
  'Bayern Invest': { primary: 'fin', note: 'BayernInvest public funds via finanzen.net (institutional Spezialfonds are not publicly sourceable)' },
  'AXA IM Alts.': { primary: 'centre', etf: 'centre', note: 'funds.axa-im.com Kurtosys fund centre (incl. the AXA IM ETF / “Easy II” range)' },
  BNP: { primary: 'centre', mf: 'fin', etf: 'jetf', note: 'bnpparibas-am.com Fund Explorer + finanzen.net; BNP Easy ETFs via justETF (no AUM/TER on own site)' },
  'HSBC T&B': { primary: 'ms', etf: 'ms', mmf: 'ms', note: 'Morningstar (/funds/ + /etfs/) + etf.hsbc.com; GIF fund AUM is approximate' },
  Blackstone: { primary: 'filings', note: 'Blackstone SEC filings / investor site (BREIT, BCRED, BXPE, BXSL perpetual vehicles)' },
  'Deka Immobilien': { primary: 'fin', note: 'Open-ended real-estate funds via deka.de / finanzen.net' },
  'Universal Invest.': { primary: 'na', note: 'Master-KVG — administers third-party funds, no own retail products' },
}

function srcFor(code: string, col: Col): SrcKey {
  const p = SRC_BY_CODE[code]
  if (!p) return 'na'
  if (col.key === 'etf') return p.etf ?? p.primary
  if (col.key === 'mf') return p.mf ?? p.primary
  if (col.key === 'mmf') return p.mmf ?? p.primary
  if (col.key === 'co') return p.co ?? p.primary
  return p.primary
}

export function srcNote(code: string): string {
  return SRC_BY_CODE[code]?.note ?? ''
}

export type Cell = { n: number; status: Status; src: SrcKey }
export type Firm = { code: string; name: string; prods: number; tier: Tier; sure: boolean; cells: Cell[] }

/** Build the competitor rows (counts, coverage status, and source per cell), sorted by size. */
export function buildFirms(): Firm[] {
  return COMPANIES.map((c) => {
    const prods = productsForCompetitor(c.tick)
    const tier: Tier = PARTIAL.has(c.tick)
      ? 'partial'
      : prods.length > 0 || CONFIRMED_NONE.has(c.tick)
        ? 'full'
        : 'none'
    const cells: Cell[] = COLUMNS.map((col) => {
      const n = count(prods, col)
      return { n, status: grade(n, col, tier), src: srcFor(c.tick, col) }
    })
    // `sure` (a zero is a confirmed structural absence, not a gap) holds for fully-covered firms.
    return { code: c.tick, name: c.co, prods: prods.length, tier, sure: tier !== 'partial', cells }
  }).sort((a, b) => b.prods - a.prods || a.name.localeCompare(b.name))
}
