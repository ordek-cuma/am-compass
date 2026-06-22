// Product Data Room sample universe — one row per FUND.
// Ported verbatim from the reference build; children (classes/listings/holdings) are derived.
import type { Fund, FacetMap, Holding, Listing, ShareClass } from './types'

type FundBase = Omit<
  Fund,
  'fundId' | 'inception' | 'structure' | 'strategy' | 'mgmtCompany' | 'umbrella' | 'classes' | 'listings' | 'holdings'
>

const FUND_BASE: FundBase[] = [
  { n: 'iShares Core MSCI World UCITS ETF', t: 'IWDA', isin: 'IE00B4L5Y983', pv: 'iShares', ac: 'Equity', sac: 'Broad Market', rg: 'Global', mkt: 'Developed', sfdr: 'Article 8', esg: 'AA', style: 'Market Cap', ccy: 'USD', dist: 'Accumulating', dom: 'Ireland', size: 78420, cost: 0.2, y1: 18.6 },
  { n: 'iShares Core S&P 500 UCITS ETF', t: 'CSPX', isin: 'IE00B5BMR087', pv: 'iShares', ac: 'Equity', sac: 'Large Cap', rg: 'North America', mkt: 'Developed', sfdr: 'Article 8', esg: 'AA', style: 'Market Cap', ccy: 'USD', dist: 'Accumulating', dom: 'Ireland', size: 96250, cost: 0.07, y1: 22.4 },
  { n: 'Vanguard S&P 500 UCITS ETF', t: 'VUSA', isin: 'IE00B3XXRP09', pv: 'Vanguard', ac: 'Equity', sac: 'Large Cap', rg: 'North America', mkt: 'Developed', sfdr: 'Article 6', esg: 'A', style: 'Market Cap', ccy: 'USD', dist: 'Distributing', dom: 'Ireland', size: 51230, cost: 0.07, y1: 22.1 },
  { n: 'Vanguard FTSE All-World UCITS ETF', t: 'VWRL', isin: 'IE00B3RBWM25', pv: 'Vanguard', ac: 'Equity', sac: 'Broad Market', rg: 'Global', mkt: 'Global', sfdr: 'Article 6', esg: 'A', style: 'Market Cap', ccy: 'USD', dist: 'Distributing', dom: 'Ireland', size: 19840, cost: 0.22, y1: 17.9 },
  { n: 'iShares Core MSCI EM IMI UCITS ETF', t: 'EIMI', isin: 'IE00BKM4GZ66', pv: 'iShares', ac: 'Equity', sac: 'Broad Market', rg: 'Emerging Markets', mkt: 'Emerging', sfdr: 'Article 8', esg: 'A', style: 'Market Cap', ccy: 'USD', dist: 'Accumulating', dom: 'Ireland', size: 22310, cost: 0.18, y1: 9.3 },
  { n: 'Xtrackers MSCI World UCITS ETF', t: 'XDWD', isin: 'IE00BJ0KDQ92', pv: 'Xtrackers', ac: 'Equity', sac: 'Broad Market', rg: 'Global', mkt: 'Developed', sfdr: 'Article 8', esg: 'AA', style: 'Market Cap', ccy: 'USD', dist: 'Accumulating', dom: 'Ireland', size: 12760, cost: 0.19, y1: 18.4 },
  { n: 'SPDR S&P 500 UCITS ETF', t: 'SPY5', isin: 'IE00B6YX5C33', pv: 'SPDR', ac: 'Equity', sac: 'Large Cap', rg: 'North America', mkt: 'Developed', sfdr: 'Article 6', esg: 'A', style: 'Market Cap', ccy: 'USD', dist: 'Distributing', dom: 'Ireland', size: 9870, cost: 0.03, y1: 22.5 },
  { n: 'iShares MSCI Japan UCITS ETF', t: 'IJPN', isin: 'IE00B02KXH56', pv: 'iShares', ac: 'Equity', sac: 'Broad Market', rg: 'Japan', mkt: 'Developed', sfdr: 'Article 6', esg: 'A', style: 'Market Cap', ccy: 'USD', dist: 'Accumulating', dom: 'Ireland', size: 4120, cost: 0.48, y1: 11.2 },
  { n: 'Amundi MSCI Europe UCITS ETF', t: 'CEU', isin: 'LU1681042518', pv: 'Amundi', ac: 'Equity', sac: 'Broad Market', rg: 'Europe', mkt: 'Developed', sfdr: 'Article 8', esg: 'AA', style: 'Market Cap', ccy: 'EUR', dist: 'Accumulating', dom: 'Luxembourg', size: 6540, cost: 0.15, y1: 12.8 },
  { n: 'iShares Global Clean Energy UCITS ETF', t: 'INRG', isin: 'IE00B1XNHC34', pv: 'iShares', ac: 'Equity', sac: 'Sector / Thematic', rg: 'Global', mkt: 'Global', sfdr: 'Article 9', esg: 'AAA', style: 'Thematic', ccy: 'USD', dist: 'Accumulating', dom: 'Ireland', size: 4380, cost: 0.65, y1: -3.4 },
  { n: 'iShares MSCI World Small Cap UCITS ETF', t: 'WSML', isin: 'IE00BF4RFH31', pv: 'iShares', ac: 'Equity', sac: 'Sector / Thematic', rg: 'Global', mkt: 'Developed', sfdr: 'Article 8', esg: 'A', style: 'Factor / Smart Beta', ccy: 'USD', dist: 'Accumulating', dom: 'Ireland', size: 5670, cost: 0.35, y1: 14.1 },
  { n: 'iShares Physical Gold ETC', t: 'SGLN', isin: 'IE00B4ND3602', pv: 'iShares', ac: 'Commodity', sac: 'Precious Metals', rg: 'Global', mkt: 'Global', sfdr: 'Article 6', esg: '—', style: 'Market Cap', ccy: 'USD', dist: 'Accumulating', dom: 'Ireland', size: 22340, cost: 0.12, y1: 21.6 },
  { n: 'Invesco Physical Gold ETC', t: 'SGLD', isin: 'IE00B579F325', pv: 'Invesco', ac: 'Commodity', sac: 'Precious Metals', rg: 'Global', mkt: 'Global', sfdr: 'Article 6', esg: '—', style: 'Market Cap', ccy: 'USD', dist: 'Accumulating', dom: 'Ireland', size: 18900, cost: 0.12, y1: 21.7 },
  { n: 'iShares Core Global Aggregate Bond UCITS ETF', t: 'AGGG', isin: 'IE00B43QJJ40', pv: 'iShares', ac: 'Fixed Income', sac: 'Aggregate', rg: 'Global', mkt: 'Global', sfdr: 'Article 8', esg: 'A', style: 'Market Cap', ccy: 'USD', dist: 'Distributing', dom: 'Ireland', size: 8760, cost: 0.1, y1: 3.1 },
  { n: 'iShares € Corp Bond UCITS ETF', t: 'IEAC', isin: 'IE00B3F81R35', pv: 'iShares', ac: 'Fixed Income', sac: 'Corporate', rg: 'Europe', mkt: 'Developed', sfdr: 'Article 8', esg: 'A', style: 'Market Cap', ccy: 'EUR', dist: 'Distributing', dom: 'Ireland', size: 12450, cost: 0.2, y1: 4.2 },
  { n: 'Xtrackers II EUR Corporate Bond UCITS ETF', t: 'XBLC', isin: 'LU0478205379', pv: 'Xtrackers', ac: 'Fixed Income', sac: 'Corporate', rg: 'Europe', mkt: 'Developed', sfdr: 'Article 8', esg: 'A', style: 'Market Cap', ccy: 'EUR', dist: 'Accumulating', dom: 'Luxembourg', size: 3980, cost: 0.16, y1: 4.0 },
  { n: 'iShares $ Treasury Bond 7-10yr UCITS ETF', t: 'IBTM', isin: 'IE00B1FZS798', pv: 'iShares', ac: 'Fixed Income', sac: 'Government', rg: 'North America', mkt: 'Developed', sfdr: 'Article 6', esg: '—', style: 'Market Cap', ccy: 'USD', dist: 'Accumulating', dom: 'Ireland', size: 5230, cost: 0.07, y1: 2.6 },
  { n: 'Amundi US Treasury 7-10y UCITS ETF', t: 'U10H', isin: 'LU1407887162', pv: 'Amundi', ac: 'Fixed Income', sac: 'Government', rg: 'North America', mkt: 'Developed', sfdr: 'Article 6', esg: '—', style: 'Market Cap', ccy: 'EUR', dist: 'Accumulating', dom: 'Luxembourg', size: 1870, cost: 0.14, y1: 2.4 },
  { n: 'iShares Developed Markets Property Yield UCITS ETF', t: 'IWDP', isin: 'IE00B1FZS350', pv: 'iShares', ac: 'Real Estate', sac: 'REITs', rg: 'Global', mkt: 'Developed', sfdr: 'Article 8', esg: 'A', style: 'Market Cap', ccy: 'USD', dist: 'Distributing', dom: 'Ireland', size: 2140, cost: 0.59, y1: 6.7 },
  { n: 'SPDR Dow Jones Global Real Estate UCITS ETF', t: 'GLRE', isin: 'IE00B8GF1M35', pv: 'SPDR', ac: 'Real Estate', sac: 'REITs', rg: 'Global', mkt: 'Global', sfdr: 'Article 6', esg: 'A', style: 'Market Cap', ccy: 'USD', dist: 'Distributing', dom: 'Ireland', size: 980, cost: 0.4, y1: 5.9 },
]

const PVMAP: Record<string, [string, string]> = {
  iShares: ['BlackRock Asset Mgmt Ireland', 'iShares plc (ICAV)'],
  Vanguard: ['Vanguard Group (Ireland)', 'Vanguard Funds plc'],
  SPDR: ['State Street Global Advisors', 'SSGA SPDR ETFs Europe plc'],
  Xtrackers: ['DWS Investment', 'Xtrackers (IE) plc'],
  Amundi: ['Amundi Asset Management', 'Amundi Index Solutions'],
  Invesco: ['Invesco Investment Management', 'Invesco Markets plc'],
}
const INC = ['2009-09-25', '2010-05-19', '2012-03-14', '2014-11-07', '2016-06-30', '2018-01-22', '2019-10-03', '2021-04-15']
const MEGACAP = ['Apple Inc.', 'Microsoft Corp.', 'NVIDIA Corp.', 'Amazon.com Inc.', 'Alphabet Inc.', 'Meta Platforms', 'Broadcom Inc.', 'Eli Lilly & Co.', 'JPMorgan Chase', 'Berkshire Hathaway']
const BONDHLD = ['US Treasury N/B', 'Bundesrepublik Deutschland', 'France (Govt of)', 'Italy (Rep of) BTP', 'Spain (Kingdom of)', 'US Treasury Bond', 'Japan (Govt of)', 'United Kingdom Gilt', 'Netherlands (Govt)', 'Canada (Govt of)']

function varISIN(isin: string, k: number): string {
  const a = isin.split('')
  const p = isin.length - 3
  a[p] = String((parseInt(a[p], 10) || 0) + k + 1).slice(-1)
  return a.join('')
}

function buildClasses(f: FundBase, i: number): ShareClass[] {
  const flip: ShareClass['dist'] = f.dist === 'Accumulating' ? 'Distributing' : 'Accumulating'
  const cls: ShareClass[] = [
    { name: (f.dist === 'Accumulating' ? 'Acc' : 'Dist') + ' · ' + f.ccy, isin: f.isin, ccy: f.ccy, dist: f.dist, hedged: 'No' },
    { name: (flip === 'Accumulating' ? 'Acc' : 'Dist') + ' · ' + f.ccy, isin: varISIN(f.isin, 1), ccy: f.ccy, dist: flip, hedged: 'No' },
  ]
  if (i % 2 === 0) cls.push({ name: 'Acc · EUR Hedged', isin: varISIN(f.isin, 4), ccy: 'EUR', dist: 'Accumulating', hedged: 'Yes' })
  return cls
}

function buildListings(f: FundBase, cls: ShareClass[]): Listing[] {
  const venues: [string, string][] = [['Xetra', 'GY'], ['London SE', 'LN'], ['SIX Swiss', 'SW'], ['Borsa Italiana', 'IM']]
  const out: Listing[] = []
  cls.forEach((c, ci) => {
    const n = 1 + ((f.t.length + ci) % 2)
    for (let k = 0; k < n; k++) {
      const v = venues[(ci + k) % venues.length]
      out.push({
        cls: c.name,
        exch: v[0],
        ticker: ci === 0 && k === 0 ? f.t : f.t.slice(0, 3) + ('' + ci + k),
        bbg: f.t + ' ' + v[1],
        ccy: k === 0 ? c.ccy : 'EUR',
        primary: ci === 0 && k === 0,
      })
    }
  })
  return out
}

function buildHoldings(f: FundBase): Holding[] {
  if (f.ac === 'Equity') return MEGACAP.map((n) => ({ name: n }))
  if (f.ac === 'Fixed Income') return BONDHLD.map((n) => ({ name: n }))
  return []
}

function buildFund(f: FundBase, i: number): Fund {
  const isETC = /ETC/.test(f.n)
  const pm = PVMAP[f.pv] || [f.pv + ' AM', f.pv + ' plc']
  const cls = buildClasses(f, i)
  return {
    ...f,
    fundId: 'F' + String(10000 + i * 37),
    inception: INC[i % INC.length],
    structure: isETC ? 'ETC' : 'UCITS ETF',
    strategy: 'Index / Passive',
    mgmtCompany: pm[0],
    umbrella: pm[1],
    classes: cls,
    listings: buildListings(f, cls),
    holdings: buildHoldings(f),
  }
}

export const FUNDS: Fund[] = FUND_BASE.map(buildFund)

export const FACETS: FacetMap = {
  pv: ['Provider', 'iShares', 'Vanguard', 'SPDR', 'Xtrackers', 'Amundi', 'Invesco'],
  structure: ['Structure / Vehicle', 'UCITS ETF', 'ETC', 'Open-end MF', 'Closed-end', 'MMF'],
  strategy: ['Strategy', 'Index / Passive', 'Active', 'Factor / Smart Beta', 'Thematic'],
  ac: ['Asset Class', 'Equity', 'Fixed Income', 'Commodity', 'Real Estate'],
  sac: ['Sub-Asset Class', 'Broad Market', 'Large Cap', 'Sector / Thematic', 'Government', 'Corporate', 'Aggregate', 'Precious Metals', 'REITs'],
  rg: ['Region', 'Global', 'North America', 'Europe', 'Emerging Markets', 'Japan'],
  mkt: ['Market Type', 'Developed', 'Emerging', 'Global'],
  sfdr: ['SFDR', 'Article 6', 'Article 8', 'Article 9'],
  esg: ['ESG Rating', 'AAA', 'AA', 'A', 'BBB'],
  style: ['Investment Style', 'Market Cap', 'Factor / Smart Beta', 'Thematic'],
  ccy: ['Currency', 'USD', 'EUR', 'GBP'],
  dist: ['Distribution', 'Accumulating', 'Distributing'],
  dom: ['Domicile', 'Ireland', 'Luxembourg', 'Germany'],
}
