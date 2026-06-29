// Settings › Data Coverage › Document Coverage — a completeness matrix for the document archive:
// every competitor × document type, the cell number being how many documents we've crawled, graded
//   green  = well-covered (≥3 of that type; ≥20 documents total)
//   orange = a thin presence (1–2)
//   red    = nothing collected
// Counts are the real crawled documents in the snapshot (competitor_financials.json → documents[]).
// Where each document is fetched FROM lives on the sibling Document Fetcher page.
import { useMemo } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { allFinancials } from '../../data/financials'

type Status = 'green' | 'orange' | 'red'
type Col = { key: string; label: string; total?: boolean }

// Document-type columns (after normalising the snapshot's group tags).
const COLUMNS: Col[] = [
  { key: 'total', label: 'Documents', total: true },
  { key: 'Annual', label: 'Annual' },
  { key: 'Quarterly', label: 'Quarterly' },
  { key: 'Earnings / Events', label: 'Earnings' },
  { key: 'Reports', label: 'Reports' },
  { key: 'Proxy', label: 'Proxy' },
  { key: 'Regulatory', label: 'Regulatory' },
]
// fold stray/small group tags into the canonical columns.
const GROUP_MAP: Record<string, string> = { '10-K': 'Annual', Letters: 'Reports', Other: 'Reports' }

const COLOR: Record<Status, string> = { green: '#1f9d76', orange: '#d68a2c', red: '#cf6a63' }

function grade(n: number, total: boolean): Status {
  if (n === 0) return 'red'
  if (total) return n >= 20 ? 'green' : 'orange'
  return n >= 3 ? 'green' : 'orange'
}

export function DocumentCoverage() {
  const { firms, totals, colTotals, docTotal, withDocs } = useMemo(() => {
    const firms = allFinancials().map(({ code, block }) => {
      const byGroup: Record<string, number> = {}
      let total = 0
      for (const d of block.documents ?? []) {
        const g = GROUP_MAP[d.group || 'Other'] ?? d.group ?? 'Other'
        byGroup[g] = (byGroup[g] || 0) + 1
        total++
      }
      const cells = COLUMNS.map((c) => {
        const n = c.total ? total : byGroup[c.key] ?? 0
        return { n, status: grade(n, !!c.total) }
      })
      return { code, name: block.name || code, total, cells }
    }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

    const totals = { green: 0, orange: 0, red: 0 }
    const colTotals = COLUMNS.map(() => ({ green: 0, orange: 0, red: 0 }))
    firms.forEach((f) => f.cells.forEach((cell, i) => { totals[cell.status]++; colTotals[i][cell.status]++ }))
    const docTotal = firms.reduce((a, f) => a + f.total, 0)
    const withDocs = firms.filter((f) => f.total > 0).length
    return { firms, totals, colTotals, docTotal, withDocs }
  }, [])

  const cellCount = totals.green + totals.orange + totals.red
  const pct = (n: number) => Math.round((100 * n) / Math.max(1, cellCount))

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Settings <b>›</b> Data Coverage <b>›</b> Document Coverage</>}
        title={<>Document <span className="em">Coverage</span></>}
        sub={`How complete the document archive is across ${firms.length} competitors — ${docTotal.toLocaleString()} documents crawled from ${withDocs} of them. The cell number is the document count by type; green = well-covered (≥3 of a type; ≥20 total), amber = thin (1–2), red = none. Where each document is fetched from is on the Document Fetcher page.`}
      />
      <div className="view">
        <Panel title={<>Document completeness <span className="muted2">{withDocs}/{firms.length} with documents · {docTotal.toLocaleString()} crawled · {pct(totals.green)}% well-covered · {pct(totals.orange)}% thin · {pct(totals.red)}% empty</span></>}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5 }}>
            {(['green', 'orange', 'red'] as Status[]).map((s) => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: COLOR[s], display: 'inline-block' }} />
                <b style={{ color: 'var(--ink-1)' }}>{totals[s]}</b>
                <span className="muted2">{s === 'green' ? 'well covered' : s === 'orange' ? 'thin (1–2)' : 'none'}</span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={<>Document coverage matrix <span className="muted2">competitor × document type · number = documents crawled</span></>} bodyStyle={{ padding: 0 }}>
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
                          title={`${COLUMNS[i].label}: ${cell.n} document${cell.n === 1 ? '' : 's'}`}
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
