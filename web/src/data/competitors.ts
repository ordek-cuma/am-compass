// Radar — the watchlist of asset-management competitors to monitor (not deep-dives;
// deep-dives live in the Company Data Room). Taxonomy researched per firm:
//   region (HQ), owner (who controls it), focus (what they're known for),
//   category (DISCLOSURE REGIME → where to fetch their data), website.
// Operational fields (last-fetched, status) are wired later — placeholders for now;
// the Data Source column is derived from `category` (see CATEGORY_SOURCE).

export type Region = 'North America' | 'Europe'
export type Owner = 'Independent' | 'Bank' | 'Insurer' | 'Public / Cooperative'
export type Focus =
  | 'Diversified'
  | 'ETF / Index'
  | 'Fixed Income'
  | 'Alternatives'
  | 'Real Estate'
  | 'Platform / Master-KVG'

/** Disclosure regime = the primary place to fetch corporate/product intel. */
export type Category = 'US-listed' | 'Private / Mutual' | 'European-listed' | 'German KVG'

/** Per-category primary source (drives the Data Source column). */
export const CATEGORY_SOURCE: Record<Category, string> = {
  'US-listed': 'SEC EDGAR — 10-K (group filers via parent)',
  'Private / Mutual': 'Form ADV + fund filings',
  'European-listed': 'Universal Registration Document (URD)',
  'German KVG': 'Bundesanzeiger + fund Jahresberichte',
}

export interface Competitor {
  /** Accurate legal/brand name (may differ from the as-listed shorthand). */
  name: string
  /** The user's shorthand code. */
  code: string
  hq: string
  region: Region
  owner: Owner
  focus: Focus
  category: Category
  /** Bare domain; the UI builds the https:// link. */
  website: string
  /** Disambiguation / ownership notes surfaced in the table. */
  note?: string
}

export const COMPETITORS: Competitor[] = [
  { name: 'AllianceBernstein', code: 'AB', hq: 'Nashville, US', region: 'North America', owner: 'Independent', focus: 'Diversified', category: 'US-listed', website: 'alliancebernstein.com', note: 'Listed (NYSE: AB); majority-controlled by Equitable Holdings' },
  { name: 'Allianz Global Investors', code: 'AGI', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Insurer', focus: 'Diversified', category: 'European-listed', website: 'allianzgi.com', note: 'Allianz-owned; sister manager to PIMCO. Allianz group URD' },
  { name: 'PIMCO', code: 'PIMCO', hq: 'Newport Beach, US', region: 'North America', owner: 'Insurer', focus: 'Fixed Income', category: 'Private / Mutual', website: 'pimco.com', note: 'Private Allianz subsidiary — no 10-K; Form ADV + fund filings' },
  { name: 'Affiliated Managers Group', code: 'AMG', hq: 'West Palm Beach, US', region: 'North America', owner: 'Independent', focus: 'Diversified', category: 'US-listed', website: 'amg.com', note: 'Listed multi-boutique holding (NYSE: AMG)' },
  { name: 'Amundi', code: 'AMU', hq: 'Paris, FR', region: 'Europe', owner: 'Bank', focus: 'ETF / Index', category: 'European-listed', website: 'amundi.com', note: 'Crédit Agricole majority; largest European AM. Files a URD' },
  { name: 'DWS Group', code: 'DWS', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Bank', focus: 'Diversified', category: 'European-listed', website: 'dws.com', note: 'Deutsche Bank-controlled (~79%); listed Frankfurt (DWS). Xtrackers ETFs' },
  { name: 'Schroders', code: 'Schroders', hq: 'London, UK', region: 'Europe', owner: 'Independent', focus: 'Diversified', category: 'European-listed', website: 'schroders.com', note: 'Listed (LSE: SDR); family-anchored. Schroders Capital private markets' },
  { name: 'Aberdeen Group (abrdn)', code: 'abrdn', hq: 'Edinburgh, UK', region: 'Europe', owner: 'Independent', focus: 'Diversified', category: 'European-listed', website: 'aberdeeninvestments.com', note: 'Listed (LSE: ABDN); renamed abrdn → Aberdeen Group 2025. Incl. interactive investor' },
  { name: 'M&G', code: 'MandG', hq: 'London, UK', region: 'Europe', owner: 'Independent', focus: 'Diversified', category: 'European-listed', website: 'mandg.com', note: 'Listed (LSE: MNG); savings & asset management, ex-Prudential UK' },
  { name: 'BlackRock', code: 'BL', hq: 'New York, US', region: 'North America', owner: 'Independent', focus: 'ETF / Index', category: 'US-listed', website: 'blackrock.com', note: 'iShares; world’s largest AM (NYSE: BLK)' },
  { name: 'BNP Paribas Asset Management', code: 'BNP', hq: 'Paris, FR', region: 'Europe', owner: 'Bank', focus: 'Diversified', category: 'European-listed', website: 'bnpparibas-am.com', note: 'BNP Paribas group URD' },
  { name: 'Federated Hermes', code: 'FED', hq: 'Pittsburgh, US', region: 'North America', owner: 'Independent', focus: 'Fixed Income', category: 'US-listed', website: 'federatedhermes.com', note: 'Listed (NYSE: FHI). Money-market heavy + Hermes stewardship' },
  { name: 'Franklin Templeton', code: 'FT', hq: 'San Mateo, US', region: 'North America', owner: 'Independent', focus: 'Diversified', category: 'US-listed', website: 'franklintempleton.com', note: 'Listed (NYSE: BEN). Multi-affiliate (Western Asset, ClearBridge…)' },
  { name: 'Invesco', code: 'IVZ', hq: 'Atlanta, US', region: 'North America', owner: 'Independent', focus: 'ETF / Index', category: 'US-listed', website: 'invesco.com', note: 'Listed (NYSE: IVZ). QQQ + PowerShares ETF franchise' },
  { name: 'Janus Henderson', code: 'JH', hq: 'London, UK / Denver, US', region: 'Europe', owner: 'Independent', focus: 'Diversified', category: 'US-listed', website: 'janushenderson.com', note: 'Dual UK/US but SEC-registered & NYSE-listed (JHG) → 10-K' },
  { name: 'J.P. Morgan Asset Management', code: 'JPM', hq: 'New York, US', region: 'North America', owner: 'Bank', focus: 'Diversified', category: 'US-listed', website: 'am.jpmorgan.com', note: 'Group filer — disclosure via JPMorgan Chase 10-K' },
  { name: 'Morgan Stanley Investment Management', code: 'MS', hq: 'New York, US', region: 'North America', owner: 'Bank', focus: 'Diversified', category: 'US-listed', website: 'morganstanley.com/im', note: 'Group filer — Morgan Stanley 10-K. Incl. Eaton Vance, Parametric' },
  { name: 'Natixis Investment Managers', code: 'NAT', hq: 'Paris, FR / Boston, US', region: 'Europe', owner: 'Bank', focus: 'Diversified', category: 'European-listed', website: 'im.natixis.com', note: 'Groupe BPCE; multi-affiliate (Loomis Sayles, Mirova…). ⚠ Signal: combining with Generali Investments' },
  { name: 'PGIM (Prudential Financial)', code: 'PGIM', hq: 'Newark, US', region: 'North America', owner: 'Insurer', focus: 'Diversified', category: 'US-listed', website: 'pgim.com', note: 'Group filer — Prudential Financial 10-K' },
  { name: 'State Street Global Advisors', code: 'SSgA', hq: 'Boston, US', region: 'North America', owner: 'Bank', focus: 'ETF / Index', category: 'US-listed', website: 'ssga.com', note: 'Group filer — State Street 10-K. SPDR; first US ETF' },
  { name: 'T. Rowe Price', code: 'TROW', hq: 'Baltimore, US', region: 'North America', owner: 'Independent', focus: 'Diversified', category: 'US-listed', website: 'troweprice.com', note: 'Listed (NASDAQ: TROW). Active equity & target-date' },
  { name: 'UBS Asset Management', code: 'UBS', hq: 'Zurich, CH', region: 'Europe', owner: 'Bank', focus: 'Diversified', category: 'European-listed', website: 'ubs.com/am', note: 'UBS Group annual report; absorbed Credit Suisse AM (2023)' },
  { name: 'Union Investment', code: 'Union', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Public / Cooperative', focus: 'Diversified', category: 'German KVG', website: 'union-investment.de', note: 'DZ Bank cooperative group (~72%); intel in Jahresberichte' },
  { name: 'DekaBank (Deka Investment)', code: 'DEKA', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Public / Cooperative', focus: 'Diversified', category: 'German KVG', website: 'deka.de', note: 'AM of the Sparkassen savings-bank group; parent of Deka Immobilien' },
  { name: 'MEAG', code: 'MEAG', hq: 'Munich, DE', region: 'Europe', owner: 'Insurer', focus: 'Fixed Income', category: 'German KVG', website: 'meag.com', note: 'AM of Munich Re & ERGO; Bundesanzeiger + Jahresberichte' },
  { name: 'HSBC INKA (Trinkaus & Burkhardt)', code: 'HSBC T&B', hq: 'Düsseldorf, DE', region: 'Europe', owner: 'Bank', focus: 'Platform / Master-KVG', category: 'German KVG', website: 'inka-kag.de', note: 'HSBC’s German Master-KVG (ex Trinkaus & Burkhardt); pending sale to BlackFin' },
  { name: 'Universal Investment', code: 'Universal Invest.', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Independent', focus: 'Platform / Master-KVG', category: 'German KVG', website: 'universal-investment.com', note: 'PE-owned (Montagu, CPP); ~€1.4tn third-party ManCo / Service-KVG' },
  { name: 'BayernInvest', code: 'Bayern Invest', hq: 'Munich, DE', region: 'Europe', owner: 'Bank', focus: 'Platform / Master-KVG', category: 'German KVG', website: 'bayerninvest.de', note: '100% BayernLB subsidiary; institutional AM + Master-KVG' },
  { name: 'Vanguard', code: 'Vanguard', hq: 'Malvern, US', region: 'North America', owner: 'Independent', focus: 'ETF / Index', category: 'Private / Mutual', website: 'vanguard.com', note: 'Client-owned mutual structure — thin corp disclosure; fund filings' },
  { name: 'Fidelity Investments', code: 'Fidelity', hq: 'Boston, US', region: 'North America', owner: 'Independent', focus: 'Diversified', category: 'Private / Mutual', website: 'fidelity.com', note: 'Private (FMR) — Form ADV + fund filings. Intl arm FIL is separate' },
  { name: 'WisdomTree', code: 'WisdomTree', hq: 'New York, US', region: 'North America', owner: 'Independent', focus: 'ETF / Index', category: 'US-listed', website: 'wisdomtree.com', note: 'Listed (NYSE: WT). ETP specialist (smart beta, commodities)' },
  { name: 'Goldman Sachs Asset Management', code: 'Goldman Sachs', hq: 'New York, US', region: 'North America', owner: 'Bank', focus: 'Diversified', category: 'US-listed', website: 'am.gs.com', note: 'Group filer — Goldman Sachs 10-K' },
  { name: 'Blackstone', code: 'Blackstone', hq: 'New York, US', region: 'North America', owner: 'Independent', focus: 'Alternatives', category: 'US-listed', website: 'blackstone.com', note: 'Listed alternatives giant (NYSE: BX) — 10-K' },
  { name: 'Swiss Life Asset Managers', code: 'Swiss Life AM', hq: 'Zurich, CH', region: 'Europe', owner: 'Insurer', focus: 'Real Estate', category: 'European-listed', website: 'swisslife-am.com', note: 'Swiss Life group (SIX-listed) annual report; large European RE' },
  { name: 'AXA IM Alts', code: 'AXA IM Alts.', hq: 'Paris, FR', region: 'Europe', owner: 'Insurer', focus: 'Alternatives', category: 'European-listed', website: 'axa-im.com', note: '⚠ Signal: AXA IM sold to BNP Paribas (€5.1bn), merged into BNP Paribas AM on 31 Dec 2025 — no longer independent' },
  { name: 'Deka Immobilien', code: 'Deka Immobilien', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Public / Cooperative', focus: 'Real Estate', category: 'German KVG', website: 'deka-immobilien.de', note: 'Real-estate KVG of DekaBank; fund Jahresberichte' },
]

export const CR_FACETS: Record<string, string[]> = {
  category: ['Category', 'US-listed', 'Private / Mutual', 'European-listed', 'German KVG'],
  region: ['Region', 'North America', 'Europe'],
  owner: ['Owner', 'Independent', 'Bank', 'Insurer', 'Public / Cooperative'],
  focus: ['Focus', 'Diversified', 'ETF / Index', 'Fixed Income', 'Alternatives', 'Real Estate', 'Platform / Master-KVG'],
}
