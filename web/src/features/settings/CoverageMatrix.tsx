// Settings › Data Fetcher › Coverage — a completeness matrix for every competitor × metric.
// Reads the committed snapshot (competitor_financials.json) and grades each cell:
//   green  = complete (a time-series with ≥3 years of history, or a present point/breakdown)
//   orange = present but a short series (1–2 years only)
//   red    = no data collected
// The companion provenance ledger (which vendor each number comes from) lives on the
// Financial Fetcher page; this page is purely about coverage/completeness.
import { useMemo } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { allFinancials, type FinBlock } from '../../data/financials'

type Status = 'green' | 'orange' | 'red'
type ColType = 'series' | 'point' | 'breakdown' | 'composite'
type Col = { key: string; label: string; type: ColType; from?: string[] }

// The columns that matter for competitive analysis, grouped left→right by theme.
const COLUMNS: Col[] = [
  { key: 'aum_total', label: 'AuM', type: 'series' },
  { key: 'net_flows', label: 'Net flows', type: 'series' },
  { key: 'total_revenue', label: 'Revenue', type: 'series' },
  { key: 'operating_margin', label: 'Op margin', type: 'series' },
  { key: 'net_income', label: 'Net income', type: 'series' },
  { key: 'aum_by_asset_class', label: 'AuM mix', type: 'breakdown' },
  { key: '__revmix', label: 'Revenue mix', type: 'composite', from: ['mgmt_fee_revenue', 'performance_fees', 'dist_fee_revenue', 'tech_revenue'] },
  { key: 'headcount', label: 'Headcount', type: 'point' },
  { key: 'num_countries', label: 'Countries', type: 'point' },
  { key: 'market_cap', label: 'Mkt cap', type: 'point' },
]

const COLOR: Record<Status, string> = { green: '#1f9d76', orange: '#d68a2c', red: '#cf6a63' }

type Cell = { status: Status; label: string; detail: string }

function cellFor(block: FinBlock, col: Col): Cell {
  const m = block.metrics
  if (col.type === 'composite') {
    const present = (col.from ?? []).filter((k) => m[k]?.value != null)
    return present.length
      ? { status: 'green', label: '✓', detail: `${present.length} fee line(s) disclosed` }
      : { status: 'red', label: '—', detail: 'no data' }
  }
  const met = m[col.key]
  if (col.type === 'breakdown') {
    const n = met?.members?.length ?? 0
    return n ? { status: 'green', label: String(n), detail: `${n} classes` } : { status: 'red', label: '—', detail: 'no data' }
  }
  if (col.type === 'point') {
    return met?.value != null
      ? { status: 'green', label: '✓', detail: met.period_end ? `as of ${met.period_end.slice(0, 4)}` : 'present' }
      : { status: 'red', label: '—', detail: 'no data' }
  }
  // series: count distinct years (history includes the latest year)
  const yrs = met?.history?.length ?? (met?.value != null ? 1 : 0)
  if (yrs >= 3) return { status: 'green', label: String(yrs), detail: `${yrs}-year series` }
  if (yrs >= 1) return { status: 'orange', label: String(yrs), detail: `${yrs}-year only (no 3y history)` }
  return { status: 'red', label: '—', detail: 'no data' }
}

export function CoverageMatrix() {
  const { firms, totals, colTotals } = useMemo(() => {
    const firms = allFinancials()
      .map(({ code, block }) => ({ code, block, cells: COLUMNS.map((c) => cellFor(block, c)) }))
      .sort((a, b) => (a.block.name || a.code).localeCompare(b.block.name || b.code))
    const totals = { green: 0, orange: 0, red: 0 }
    const colTotals = COLUMNS.map(() => ({ green: 0, orange: 0, red: 0 }))
    firms.forEach((f) => f.cells.forEach((cell, i) => { totals[cell.status]++; colTotals[i][cell.status]++ }))
    return { firms, totals, colTotals }
  }, [])

  const cellCount = totals.green + totals.orange + totals.red
  const pct = (n: number) => Math.round((100 * n) / Math.max(1, cellCount))

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Settings <b>›</b> Data Coverage <b>›</b> Financial Coverage</>}
        title={<>Financial <span className="em">Coverage</span></>}
        sub={`Completeness of every collected metric across ${firms.length} competitors × ${COLUMNS.length} metric families (${cellCount} cells). Green = complete (time-series with ≥3 years, or a present point/breakdown); orange = present but a short 1–2 year series; red = no data. Source provenance is on the Financial Fetcher page.`}
      />
      <div className="view">
        <Panel title={<>Completeness <span className="muted2">{pct(totals.green)}% complete · {pct(totals.orange)}% partial · {pct(totals.red)}% missing</span></>}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5 }}>
            {(['green', 'orange', 'red'] as Status[]).map((s) => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: COLOR[s], display: 'inline-block' }} />
                <b style={{ color: 'var(--ink-1)' }}>{totals[s]}</b>
                <span className="muted2">
                  {s === 'green' ? 'complete' : s === 'orange' ? 'partial (1–2yr)' : 'no data'}
                </span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={<>Coverage matrix <span className="muted2">competitor × metric · number = years of history</span></>} bodyStyle={{ padding: 0 }}>
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
                      {f.block.name || f.code}
                      <span className="muted2" style={{ marginLeft: 6, fontSize: 11 }}>{f.block.ticker || f.code}</span>
                    </td>
                    {f.cells.map((cell, i) => (
                      <td key={COLUMNS[i].key} style={{ textAlign: 'center', padding: '4px 6px' }}>
                        <span
                          title={`${COLUMNS[i].label}: ${cell.detail}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            minWidth: 26, height: 24, padding: '0 6px', borderRadius: 5,
                            background: COLOR[cell.status], color: '#fff', fontSize: 12, fontWeight: 600,
                          }}
                        >
                          {cell.label}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--surface-2)', fontWeight: 600, fontSize: 11.5 }}>Complete / total</td>
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
