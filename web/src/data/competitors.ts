// Radar — the watchlist of asset-management competitors to monitor (not deep-dives;
// deep-dives live in the Company Data Room). Taxonomy researched per firm:
//   region (HQ), owner (who controls it), focus (what they're known for), website.
// Operational fields (data source to crawl, last-fetched, status) are wired later — the
// page renders them as placeholders for now.

export type Region = 'North America' | 'Europe'
export type Owner = 'Independent' | 'Bank' | 'Insurer' | 'Public / Cooperative'
export type Focus =
  | 'Diversified'
  | 'ETF / Index'
  | 'Fixed Income'
  | 'Alternatives'
  | 'Real Estate'
  | 'Platform / Master-KVG'

export interface Competitor {
  /** Accurate legal/brand name (may differ from the as-listed shorthand). */
  name: string
  /** The user's shorthand code. */
  code: string
  hq: string
  region: Region
  owner: Owner
  focus: Focus
  /** Bare domain; the UI builds the https:// link. */
  website: string
  /** Disambiguation / duplicate flags surfaced in the table. */
  note?: string
}

export const COMPETITORS: Competitor[] = [
  { name: 'AllianceBernstein', code: 'AB', hq: 'Nashville, US', region: 'North America', owner: 'Independent', focus: 'Diversified', website: 'alliancebernstein.com', note: 'Listed; majority-controlled by Equitable Holdings' },
  { name: 'Allianz Global Investors', code: 'AGI', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Insurer', focus: 'Diversified', website: 'allianzgi.com', note: 'Allianz-owned; sister manager to PIMCO (under the Allianz AM holding)' },
  { name: 'PIMCO', code: 'PIMCO', hq: 'Newport Beach, US', region: 'North America', owner: 'Insurer', focus: 'Fixed Income', website: 'pimco.com', note: 'Allianz subsidiary' },
  { name: 'Affiliated Managers Group', code: 'AMG', hq: 'West Palm Beach, US', region: 'North America', owner: 'Independent', focus: 'Diversified', website: 'amg.com', note: 'Listed multi-boutique holding' },
  { name: 'Amundi', code: 'AMU', hq: 'Paris, FR', region: 'Europe', owner: 'Bank', focus: 'ETF / Index', website: 'amundi.com', note: 'Crédit Agricole majority; largest European AM' },
  { name: 'BlackRock', code: 'BL', hq: 'New York, US', region: 'North America', owner: 'Independent', focus: 'ETF / Index', website: 'blackrock.com', note: 'iShares; world’s largest AM (ticker BLK)' },
  { name: 'BNP Paribas Asset Management', code: 'BNP', hq: 'Paris, FR', region: 'Europe', owner: 'Bank', focus: 'Diversified', website: 'bnpparibas-am.com' },
  { name: 'Federated Hermes', code: 'FED', hq: 'Pittsburgh, US', region: 'North America', owner: 'Independent', focus: 'Fixed Income', website: 'federatedhermes.com', note: 'Money-market heavy + Hermes ESG/stewardship' },
  { name: 'Franklin Templeton', code: 'FT', hq: 'San Mateo, US', region: 'North America', owner: 'Independent', focus: 'Diversified', website: 'franklintempleton.com', note: 'Multi-affiliate (Western Asset, ClearBridge, Martin Currie…)' },
  { name: 'Invesco', code: 'IVZ', hq: 'Atlanta, US', region: 'North America', owner: 'Independent', focus: 'ETF / Index', website: 'invesco.com', note: 'QQQ + PowerShares ETF franchise' },
  { name: 'Janus Henderson', code: 'JH', hq: 'London, UK / Denver, US', region: 'Europe', owner: 'Independent', focus: 'Diversified', website: 'janushenderson.com', note: 'Dual UK/US; NYSE: JHG' },
  { name: 'J.P. Morgan Asset Management', code: 'JPM', hq: 'New York, US', region: 'North America', owner: 'Bank', focus: 'Diversified', website: 'am.jpmorgan.com', note: 'Fast-growing active-ETF franchise' },
  { name: 'Morgan Stanley Investment Management', code: 'MS', hq: 'New York, US', region: 'North America', owner: 'Bank', focus: 'Diversified', website: 'morganstanley.com/im', note: 'Incl. Eaton Vance, Calvert, Parametric' },
  { name: 'Natixis Investment Managers', code: 'NAT', hq: 'Paris, FR / Boston, US', region: 'Europe', owner: 'Bank', focus: 'Diversified', website: 'im.natixis.com', note: 'Groupe BPCE; multi-affiliate (Loomis Sayles, Mirova…)' },
  { name: 'PGIM (Prudential Financial)', code: 'PGIM', hq: 'Newark, US', region: 'North America', owner: 'Insurer', focus: 'Diversified', website: 'pgim.com', note: 'AM arm of Prudential Financial (US)' },
  { name: 'State Street Global Advisors', code: 'SSgA', hq: 'Boston, US', region: 'North America', owner: 'Bank', focus: 'ETF / Index', website: 'ssga.com', note: 'SPDR; launched the first US ETF' },
  { name: 'T. Rowe Price', code: 'TROW', hq: 'Baltimore, US', region: 'North America', owner: 'Independent', focus: 'Diversified', website: 'troweprice.com', note: 'Active equity & target-date specialist' },
  { name: 'UBS Asset Management', code: 'UBS', hq: 'Zurich, CH', region: 'Europe', owner: 'Bank', focus: 'Diversified', website: 'ubs.com/am', note: 'Absorbed Credit Suisse AM (2023)' },
  { name: 'Union Investment', code: 'Union', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Public / Cooperative', focus: 'Diversified', website: 'union-investment.de', note: 'DZ Bank cooperative group (~72%); strong UniImmo real estate' },
  { name: 'DekaBank (Deka Investment)', code: 'DEKA', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Public / Cooperative', focus: 'Diversified', website: 'deka.de', note: 'AM of the Sparkassen savings-bank group; Deka ETFs; parent of Deka Immobilien' },
  { name: 'MEAG', code: 'MEAG', hq: 'Munich, DE', region: 'Europe', owner: 'Insurer', focus: 'Fixed Income', website: 'meag.com', note: 'AM of Munich Re & ERGO' },
  { name: 'HSBC INKA (Trinkaus & Burkhardt)', code: 'HSBC T&B', hq: 'Düsseldorf, DE', region: 'Europe', owner: 'Bank', focus: 'Platform / Master-KVG', website: 'inka-kag.de', note: 'HSBC’s German Master-KVG (ex Trinkaus & Burkhardt); pending sale to BlackFin Capital' },
  { name: 'Universal Investment', code: 'Universal Invest.', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Independent', focus: 'Platform / Master-KVG', website: 'universal-investment.com', note: 'PE-owned (Montagu, CPP); ~€1.4tn third-party ManCo platform' },
  { name: 'BayernInvest', code: 'Bayern Invest', hq: 'Munich, DE', region: 'Europe', owner: 'Bank', focus: 'Platform / Master-KVG', website: 'bayerninvest.de', note: '100% BayernLB subsidiary; institutional AM + Master-KVG' },
  { name: 'Vanguard', code: 'Vanguard', hq: 'Malvern, US', region: 'North America', owner: 'Independent', focus: 'ETF / Index', website: 'vanguard.com', note: 'Client-owned mutual structure; 2nd-largest AM' },
  { name: 'Fidelity Investments', code: 'Fidelity', hq: 'Boston, US', region: 'North America', owner: 'Independent', focus: 'Diversified', website: 'fidelity.com', note: 'Private (FMR); intl arm is FIL — fidelityinternational.com' },
  { name: 'WisdomTree', code: 'WisdomTree', hq: 'New York, US', region: 'North America', owner: 'Independent', focus: 'ETF / Index', website: 'wisdomtree.com', note: 'ETP specialist (smart beta, commodities)' },
  { name: 'Goldman Sachs Asset Management', code: 'Goldman Sachs', hq: 'New York, US', region: 'North America', owner: 'Bank', focus: 'Diversified', website: 'am.gs.com' },
  { name: 'Blackstone', code: 'Blackstone', hq: 'New York, US', region: 'North America', owner: 'Independent', focus: 'Alternatives', website: 'blackstone.com', note: 'Listed alternatives giant (PE, real estate, credit)' },
  { name: 'Swiss Life Asset Managers', code: 'Swiss Life AM', hq: 'Zurich, CH', region: 'Europe', owner: 'Insurer', focus: 'Real Estate', website: 'swisslife-am.com', note: 'Large European real-estate & fixed-income manager' },
  { name: 'AXA IM Alts', code: 'AXA IM Alts.', hq: 'Paris, FR', region: 'Europe', owner: 'Insurer', focus: 'Alternatives', website: 'axa-im.com', note: 'Alternatives/real-assets arm of AXA IM' },
  { name: 'Deka Immobilien', code: 'Deka Immobilien', hq: 'Frankfurt, DE', region: 'Europe', owner: 'Public / Cooperative', focus: 'Real Estate', website: 'deka-immobilien.de', note: 'Real-estate arm of DekaBank' },
]

export const CR_FACETS: Record<string, string[]> = {
  region: ['Region', 'North America', 'Europe'],
  owner: ['Owner', 'Independent', 'Bank', 'Insurer', 'Public / Cooperative'],
  focus: ['Focus', 'Diversified', 'ETF / Index', 'Fixed Income', 'Alternatives', 'Real Estate', 'Platform / Master-KVG'],
}
