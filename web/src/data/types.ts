// Canonical Rooms data model (spec §9). Grains: Fund → Share Class → Listing → Holdings.

export interface ShareClass {
  name: string
  isin: string
  ccy: string
  dist: 'Accumulating' | 'Distributing'
  hedged: 'Yes' | 'No'
}

export interface Listing {
  cls: string
  exch: string
  ticker: string
  bbg: string
  ccy: string
  primary: boolean
}

export interface Holding {
  name: string
}

/** One row per FUND (PK: Fund ID). Share classes / listings / holdings hang off it. */
export interface Fund {
  n: string
  t: string
  isin: string
  pv: string
  ac: string
  sac: string
  rg: string
  mkt: string
  sfdr: string
  esg: string
  style: string
  ccy: string
  dist: 'Accumulating' | 'Distributing'
  dom: string
  size: number
  cost: number
  y1: number
  fundId: string
  inception: string
  structure: string
  strategy: string
  mgmtCompany: string
  umbrella: string
  classes: ShareClass[]
  listings: Listing[]
  holdings: Holding[]
}

export interface CompanyDoc {
  cat: string
  doc: string
  fmt: string
  sz: string
  date: string
}

/** One competitor in the Competitor Data Room; document grain is one row per (competitor, doc). */
export interface Company {
  co: string
  seg: string
  country: string
  tick: string
  docs: CompanyDoc[]
  // Enriched from the competitor record (Radar) when the room is competitor-backed.
  region?: string
  owner?: string
  regime?: string
  website?: string
}

export interface CompanyRow {
  co: string
  seg: string
  cat: string
  doc: string
  fmt: string
  date: string
  sz: string
}

/** Facet config: first element is the label, the rest are option values. */
export type FacetMap = Record<string, string[]>
