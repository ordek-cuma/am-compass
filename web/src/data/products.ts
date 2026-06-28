// Product Data Room universe — REAL data, sourced from each manager's published product feeds.
// Currently: BlackRock iShares (US + EMEA/UCITS product-screener feeds, fetched 2026-06-28).
// One row per product (fund / ETF). Re-snapshot by re-running scratchpad/build_products.py.
import raw from './products.json'

export interface Product {
  id: string
  name: string
  ticker: string
  isin: string
  manager: string // 'BlackRock'
  brand: string // 'iShares'
  vehicle: string // 'ETF'
  assetClass: string
  subAssetClass: string
  region: string // exposure region
  marketType: string
  style: string
  esg: string
  sfdr: string // EMEA only ('' for US)
  listing: string // 'US' | 'EMEA / UCITS'
  domicile: string
  ccy: string
  ter: number | null // %
  aum: number | null // USD millions (FX-normalised)
  inception: string // YYYY-MM-DD
  perf1y: number | null
  perf3y: number | null
  perf5y: number | null
  yield: number | null
  url: string
}

interface ProductData {
  generated_at: string
  source: string
  manager: string
  count: number
  facets: Record<string, string[]>
  products: Product[]
}

const DATA = raw as unknown as ProductData

export const PRODUCTS: Product[] = DATA.products
export const PRODUCT_FACETS: Record<string, string[]> = DATA.facets
export const PRODUCTS_SOURCE = DATA.source
export const PRODUCTS_MANAGER = DATA.manager

export function productByIsin(isin: string | undefined): Product | null {
  if (!isin) return null
  return PRODUCTS.find((p) => p.isin === isin) ?? null
}

/** Total AUM ($M) across the catalogue, for the header. */
export function totalAum(): number {
  return PRODUCTS.reduce((a, p) => a + (p.aum ?? 0), 0)
}

// Map a Competitor Data Room entity (by its competitor code) to the product-catalogue
// `manager` whose products belong to it. Extend as each manager's products are ingested.
const MANAGER_BY_CODE: Record<string, string> = {
  BL: 'BlackRock', // iShares + BGF/BSF + US BlackRock funds
  Vanguard: 'Vanguard', // UK/EU funds + US flagship ETFs/funds
  Fidelity: 'Fidelity', // US ETFs + major mutual funds (FMR; FIL is separate)
  SSgA: 'State Street Global Advisors', // SPDR ETFs + State Street funds
  IVZ: 'Invesco', // QQQ + Invesco ETFs + US mutual funds
  // US issuers — ETFs + full mutual-fund + MMF universe (stockanalysis.com)
  AB: 'AllianceBernstein',
  PIMCO: 'PIMCO',
  'Capital Group': 'Capital Group',
  AMG: 'Affiliated Managers Group',
  FED: 'Federated Hermes',
  FT: 'Franklin Templeton',
  JH: 'Janus Henderson',
  JPM: 'J.P. Morgan Asset Management',
  MS: 'Morgan Stanley Investment Management',
  PGIM: 'PGIM',
  TROW: 'T. Rowe Price',
  WisdomTree: 'WisdomTree',
  'Goldman Sachs': 'Goldman Sachs Asset Management',
  Blackstone: 'Blackstone',
  // European / UCITS issuers
  AMU: 'Amundi', // Amundi UCITS ETFs (incl. former Lyxor) + SICAV funds
  DWS: 'DWS', // Xtrackers UCITS ETFs
  UBS: 'UBS Asset Management', // UBS UCITS ETFs
  BNP: 'BNP Paribas Asset Management', // BNP Paribas Easy ETFs
  DEKA: 'DekaBank', // Deka UCITS ETFs + funds
  AGI: 'Allianz Global Investors', // Allianz GI SICAV funds
  Schroders: 'Schroders',
  abrdn: 'abrdn',
  MandG: 'M&G',
  NAT: 'Natixis Investment Managers', // incl. DNCA / affiliates
  Union: 'Union Investment',
  'Swiss Life AM': 'Swiss Life Asset Managers',
  'Bayern Invest': 'BayernInvest',
  'Deka Immobilien': 'Deka Immobilien', // open-ended real-estate funds
  MEAG: 'MEAG',
  'AXA IM Alts.': 'AXA IM Alts', // AXA IM fund range (acquired by BNP Dec 2025)
  // Universal Investment & HSBC INKA = Master-KVGs (administer third-party funds, no own retail range)
}

export function managerForCompetitor(code: string): string | null {
  return MANAGER_BY_CODE[code] ?? null
}

/** The catalogue products that belong to a competitor (empty until that manager is ingested). */
export function productsForCompetitor(code: string): Product[] {
  const m = MANAGER_BY_CODE[code]
  return m ? PRODUCTS.filter((p) => p.manager === m) : []
}
