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
}

export function managerForCompetitor(code: string): string | null {
  return MANAGER_BY_CODE[code] ?? null
}

/** The catalogue products that belong to a competitor (empty until that manager is ingested). */
export function productsForCompetitor(code: string): Product[] {
  const m = MANAGER_BY_CODE[code]
  return m ? PRODUCTS.filter((p) => p.manager === m) : []
}
