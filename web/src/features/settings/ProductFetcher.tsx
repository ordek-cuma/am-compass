// Settings › Data Fetcher › Product Fetcher — two matrices over competitor × product type / group.
//
//   1. Coverage (completeness CONFIDENCE): the cell number is the product count, coloured by how
//      sure we are the line is complete — NOT merely by count.
//        green  = confident: a populated line (≥5 products; ≥20 total) OR a CONFIRMED structural
//                 zero (a manager we've fully ingested that genuinely offers none of this type —
//                 e.g. Blackstone has no ETFs, Universal Investment has no own products).
//        amber  = a thin presence (1–4).
//        red    = an UNVERIFIED zero — a manager whose range we haven't fully ingested, so a 0
//                 may be a gap rather than a real absence.
//   2. Sources: the same grid, but each box shows WHERE that data is fetched from (the source
//      playbook), coloured by source family. "—" = nothing to fetch (a confirmed structural zero).
//
// Each competitor's products come from the shared Product Data Room catalogue (products.json),
// mapped via productsForCompetitor().
import { useMemo } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { COMPANIES } from '../../data/companies'
import { productsForCompetitor, type Product } from '../../data/products'

type Status = 'green' | 'orange' | 'red'
type Kind = 'total' | 'vehicle' | 'ac'
type Col = { key: string; label: string; kind: Kind; val?: string }

// Columns: product TYPES (vehicle) then product GROUPS (asset class).
const COLUMNS: Col[] = [
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

const COLOR: Record<Status, string> = { green: '#1f9d76', orange: '#d68a2c', red: '#cf6a63' }

// Managers whose catalogue we have NOT fully ingested — a zero may be an un-filled gap, so it
// renders red rather than green. Everyone else is treated as fully ingested, so a zero is a
// CONFIRMED structural absence (green). (Universal Investment is a Master-KVG with no own
// products — that confirmed-empty state is itself a "sure" green.)
const UNSURE = new Set<string>(['HSBC T&B', 'Bayern Invest', 'MEAG'])

function count(prods: Product[], col: Col): number {
  if (col.kind === 'total') return prods.length
  if (col.kind === 'vehicle') return prods.filter((p) => p.vehicle === col.val).length
  return prods.filter((p) => p.assetClass === col.val).length
}

function grade(n: number, col: Col, sure: boolean): Status {
  if (n === 0) return sure ? 'green' : 'red'
  if (col.kind === 'total') return n >= 20 ? 'green' : 'orange'
  return n >= 5 ? 'green' : 'orange'
}

// ── Source playbook ─────────────────────────────────────────────────────────────
type SrcKey = 'sa' | 'ms' | 'jetf' | 'fin' | 'centre' | 'filings' | 'na'
const SRC: Record<SrcKey, { label: string; color: string }> = {
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

export function ProductFetcher() {
  const { firms, totals, colTotals } = useMemo(() => {
    const firms = COMPANIES.map((c) => {
      const prods = productsForCompetitor(c.tick)
      const sure = !UNSURE.has(c.tick)
      const cells = COLUMNS.map((col) => {
        const n = count(prods, col)
        return { n, status: grade(n, col, sure), src: srcFor(c.tick, col) }
      })
      return { code: c.tick, name: c.co, prods: prods.length, sure, cells }
    }).sort((a, b) => b.prods - a.prods || a.name.localeCompare(b.name))
    const totals = { green: 0, orange: 0, red: 0 }
    const colTotals = COLUMNS.map(() => ({ green: 0, orange: 0, red: 0 }))
    firms.forEach((f) => f.cells.forEach((cell, i) => { totals[cell.status]++; colTotals[i][cell.status]++ }))
    return { firms, totals, colTotals }
  }, [])

  const ingested = firms.filter((f) => f.prods > 0).length
  const cellCount = totals.green + totals.orange + totals.red
  const pct = (n: number) => Math.round((100 * n) / Math.max(1, cellCount))
  const usedSrc = (Object.keys(SRC) as SrcKey[]).filter((k) => firms.some((f) => f.cells.some((c) => c.src === k)))

  const headCell = (key: string, label: string) => (
    <th key={key} className="num" style={{ textAlign: 'center', whiteSpace: 'nowrap', fontSize: 11.5 }}>{label}</th>
  )
  const firmCell = (name: string, code: string, bg: string) => (
    <td style={{ position: 'sticky', left: 0, background: bg, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {name}
      <span className="muted2" style={{ marginLeft: 6, fontSize: 11 }}>{code}</span>
    </td>
  )

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Settings <b>›</b> Data Fetcher <b>›</b> Product Fetcher</>}
        title={<>Product <span className="em">Fetcher</span></>}
        sub={`Per-competitor product coverage for ${firms.length} managers (${ingested} ingested). The first matrix grades completeness CONFIDENCE — green = a populated line or a confirmed structural zero (we're sure they offer none); amber = thin (1–4); red = an unverified zero that may be a gap. The second matrix shows where each cell's data is fetched from.`}
      />
      <div className="view">
        <Panel title={<>Coverage confidence <span className="muted2">{ingested}/{firms.length} ingested · {pct(totals.green)}% confident · {pct(totals.orange)}% thin · {pct(totals.red)}% unverified</span></>}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5 }}>
            {(['green', 'orange', 'red'] as Status[]).map((s) => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: COLOR[s], display: 'inline-block' }} />
                <b style={{ color: 'var(--ink-1)' }}>{totals[s]}</b>
                <span className="muted2">{s === 'green' ? 'confident (covered or confirmed-none)' : s === 'orange' ? 'thin (1–4)' : 'unverified zero'}</span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={<>Coverage matrix <span className="muted2">competitor × product type / group · number = products · colour = confidence</span></>} bodyStyle={{ padding: 0 }}>
          <div className="tbl-wrap">
            <table className="tbl" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1, textAlign: 'left' }}>Competitor</th>
                  {COLUMNS.map((c) => headCell(c.key, c.label))}
                </tr>
              </thead>
              <tbody>
                {firms.map((f) => (
                  <tr key={f.code}>
                    {firmCell(f.name, f.code, 'var(--surface-1)')}
                    {f.cells.map((cell, i) => (
                      <td key={COLUMNS[i].key} style={{ textAlign: 'center', padding: '4px 6px' }}>
                        <span
                          title={`${COLUMNS[i].label}: ${cell.n} product${cell.n === 1 ? '' : 's'}${cell.n === 0 ? (f.sure ? ' — confirmed none' : ' — unverified (possible gap)') : ''}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            minWidth: 26, height: 24, padding: '0 6px', borderRadius: 5,
                            background: COLOR[cell.status], color: '#fff', fontSize: 12, fontWeight: 600,
                          }}
                        >
                          {cell.n || '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--surface-2)', fontWeight: 600, fontSize: 11.5 }}>Confident / total</td>
                  {colTotals.map((ct, i) => (
                    <td key={COLUMNS[i].key} className="num" style={{ textAlign: 'center', background: 'var(--surface-2)', fontSize: 11.5 }}>
                      <b style={{ color: COLOR.green }}>{ct.green}</b>
                      <span className="muted2">/{firms.length}</span>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <Panel title={<>Data sources <span className="muted2">where each cell is fetched from — the source playbook</span></>}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5 }}>
            {usedSrc.map((k) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: SRC[k].color, display: 'inline-block' }} />
                <span className="muted2">{SRC[k].label}</span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={<>Source matrix <span className="muted2">competitor × product type / group · where to fetch the data</span></>} bodyStyle={{ padding: 0 }}>
          <div className="tbl-wrap">
            <table className="tbl" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1, textAlign: 'left' }}>Competitor</th>
                  {COLUMNS.map((c) => headCell(c.key, c.label))}
                </tr>
              </thead>
              <tbody>
                {firms.map((f) => {
                  const note = SRC_BY_CODE[f.code]?.note ?? ''
                  return (
                    <tr key={f.code}>
                      {firmCell(f.name, f.code, 'var(--surface-1)')}
                      {f.cells.map((cell, i) => {
                        // Nothing to fetch where it's a confirmed structural zero (sure & none).
                        const blank = cell.src === 'na' || (cell.n === 0 && f.sure)
                        const meta = SRC[cell.src]
                        return (
                          <td key={COLUMNS[i].key} style={{ textAlign: 'center', padding: '4px 6px' }}>
                            {blank ? (
                              <span className="muted2" style={{ fontSize: 12 }}>—</span>
                            ) : (
                              <span
                                title={`${COLUMNS[i].label} → ${meta.label}\n${note}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  minWidth: 26, height: 24, padding: '0 8px', borderRadius: 5,
                                  background: meta.color, color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                                }}
                              >
                                {meta.label}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  )
}
