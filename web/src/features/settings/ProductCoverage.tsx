// Settings › Data Fetcher › Product Coverage — a completeness matrix for every competitor ×
// product type / group, graded green / amber / red like the financial Data Coverage page.
//   green  = a well-populated product line (≥5 products; ≥20 for the Total column)
//   amber  = a thin presence (1–4)
//   red    = nothing ingested for that group
// Each competitor's products come from the shared Product Data Room catalogue (products.json),
// mapped via productsForCompetitor(). Competitors not yet ingested show all red.
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

function count(prods: Product[], col: Col): number {
  if (col.kind === 'total') return prods.length
  if (col.kind === 'vehicle') return prods.filter((p) => p.vehicle === col.val).length
  return prods.filter((p) => p.assetClass === col.val).length
}

function grade(n: number, col: Col): Status {
  if (n === 0) return 'red'
  if (col.kind === 'total') return n >= 20 ? 'green' : 'orange'
  return n >= 5 ? 'green' : 'orange'
}

export function ProductCoverage() {
  const { firms, totals, colTotals } = useMemo(() => {
    const firms = COMPANIES.map((c) => {
      const prods = productsForCompetitor(c.tick)
      const cells = COLUMNS.map((col) => {
        const n = count(prods, col)
        return { n, status: grade(n, col) }
      })
      return { code: c.tick, name: c.co, prods: prods.length, cells }
    }).sort((a, b) => b.prods - a.prods || a.name.localeCompare(b.name))
    const totals = { green: 0, orange: 0, red: 0 }
    const colTotals = COLUMNS.map(() => ({ green: 0, orange: 0, red: 0 }))
    firms.forEach((f) => f.cells.forEach((cell, i) => { totals[cell.status]++; colTotals[i][cell.status]++ }))
    return { firms, totals, colTotals }
  }, [])

  const ingested = firms.filter((f) => f.prods > 0).length
  const cellCount = totals.green + totals.orange + totals.red
  const pct = (n: number) => Math.round((100 * n) / Math.max(1, cellCount))

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Settings <b>›</b> Data Fetcher <b>›</b> Product Coverage</>}
        title={<>Product <span className="em">Coverage</span></>}
        sub={`Which product types & groups are ingested for each of ${firms.length} competitors (${ingested} live so far). Green = a well-populated line (≥5 products; ≥20 total); amber = a thin presence (1–4); red = nothing ingested. Products come from the Product Data Room catalogue; the cell number is the product count.`}
      />
      <div className="view">
        <Panel title={<>Coverage <span className="muted2">{ingested}/{firms.length} competitors live · {pct(totals.green)}% green · {pct(totals.orange)}% partial · {pct(totals.red)}% empty</span></>}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5 }}>
            {(['green', 'orange', 'red'] as Status[]).map((s) => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: COLOR[s], display: 'inline-block' }} />
                <b style={{ color: 'var(--ink-1)' }}>{totals[s]}</b>
                <span className="muted2">{s === 'green' ? 'well covered' : s === 'orange' ? 'thin (1–4)' : 'none'}</span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={<>Product coverage matrix <span className="muted2">competitor × product type / group · number = products</span></>} bodyStyle={{ padding: 0 }}>
          <div className="tbl-wrap">
            <table className="tbl" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1, textAlign: 'left' }}>Competitor</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="num" style={{ textAlign: 'center', whiteSpace: 'nowrap', fontSize: 11.5 }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {firms.map((f) => (
                  <tr key={f.code}>
                    <td style={{ position: 'sticky', left: 0, background: 'var(--surface-1)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {f.name}
                      <span className="muted2" style={{ marginLeft: 6, fontSize: 11 }}>{f.code}</span>
                    </td>
                    {f.cells.map((cell, i) => (
                      <td key={COLUMNS[i].key} style={{ textAlign: 'center', padding: '4px 6px' }}>
                        <span
                          title={`${COLUMNS[i].label}: ${cell.n} product${cell.n === 1 ? '' : 's'}`}
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
                  <td style={{ position: 'sticky', left: 0, background: 'var(--surface-2)', fontWeight: 600, fontSize: 11.5 }}>Covered / total</td>
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
      </div>
    </>
  )
}
