// Settings › Data Coverage › Product Coverage — a completeness-CONFIDENCE matrix for every
// competitor × product type / group. The cell number is the product count; the colour grades how
// sure we are the line is complete (NOT merely the count):
//   green  = a populated line (≥5 products; ≥20 total) OR a CONFIRMED structural zero — a manager
//            we've fully ingested that genuinely offers none of this type (e.g. Blackstone has no
//            ETFs; Universal Investment has no own products).
//   amber  = a thin presence (1–4).
//   red    = an UNVERIFIED zero — a manager whose range we haven't fully ingested, so a 0 may be a
//            gap rather than a real absence.
// Where each cell's data is fetched from lives on the sibling Product Fetcher page.
import { useMemo } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { buildFirms, COLUMNS, COLOR, type Status } from './productMatrix'

export function ProductCoverage() {
  const { firms, totals, colTotals } = useMemo(() => {
    const firms = buildFirms()
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
        crumb={<>Compass <b>›</b> Settings <b>›</b> Data Coverage <b>›</b> Product Coverage</>}
        title={<>Product <span className="em">Coverage</span></>}
        sub={`Whether we hold each of ${firms.length} competitors' product range (${ingested} ingested). Colour = COVERAGE, not count: green = covered (publicly-available range ingested) — the cell number is the product count, and 0 means they offer none of that type; amber = partially ingested; red = not ingested. A manager that genuinely offers only a fund or two in a category is still fully covered (green). Where the data is fetched from is on the Product Fetcher page.`}
      />
      <div className="view">
        <Panel title={<>Coverage <span className="muted2">{ingested}/{firms.length} ingested · {pct(totals.green)}% covered · {pct(totals.orange)}% partial · {pct(totals.red)}% not ingested</span></>}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5 }}>
            {(['green', 'orange', 'red'] as Status[]).map((s) => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: COLOR[s], display: 'inline-block' }} />
                <b style={{ color: 'var(--ink-1)' }}>{totals[s]}</b>
                <span className="muted2">{s === 'green' ? 'covered (count shown; 0 = none offered)' : s === 'orange' ? 'partially ingested' : 'not ingested'}</span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={<>Coverage matrix <span className="muted2">competitor × product type / group · number = products · colour = coverage</span></>} bodyStyle={{ padding: 0 }}>
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
