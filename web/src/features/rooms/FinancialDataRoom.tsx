// Financial Data Room — one row per REAL financial data point across every competitor (the
// flattened metric snapshot from the ingestion agent), each line carrying the vendor it came
// from. Mirrors the Document Data Room: filter + sort the flat feed; click a competitor to open
// its full profile.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { ExportIcon, Icon, MagIcon } from '../../components/icons'
import { allFinancialPoints, VENDOR_LABEL, type FinPointRow } from '../../data/financials'
import { METRICS_BY_TAB, OVERVIEW_TILES, REVENUE_LINES, TAB_LABEL, type Tab } from '../../data/metricCatalog'

// metric key → human label + category (tab), flattened from the catalog.
const META: Record<string, { label: string; cat: string }> = (() => {
  const m: Record<string, { label: string; cat: string }> = {}
  for (const [tab, defs] of Object.entries(METRICS_BY_TAB)) {
    for (const d of defs ?? []) m[d.key] = { label: d.label, cat: TAB_LABEL[tab as Tab] }
  }
  for (const d of REVENUE_LINES) m[d.key] ??= { label: d.label, cat: 'Revenue & Fees' }
  for (const d of OVERVIEW_TILES) m[d.key] ??= { label: d.label, cat: 'Overview' }
  return m
})()
const metricLabel = (k: string) => META[k]?.label ?? k
const metricCat = (k: string) => META[k]?.cat ?? 'Other'
const TIER_CLASS: Record<number, string> = { 1: 'have', 2: 'partial', 3: 'partial', 4: 'add' }
const vendorLabel = (v: string) => VENDOR_LABEL[v]?.label ?? v
const vendorTier = (v: string) => VENDOR_LABEL[v]?.tier ?? 4

type SortState = { k: string; d: number }
const COLS: [string, string][] = [
  ['competitor', 'Competitor'],
  ['cat', 'Category'],
  ['metric', 'Data Point'],
  ['value', 'Value'],
  ['source', 'Source'],
  ['basis', 'Basis'],
  ['period', 'Period'],
]
const uniq = (xs: string[]) => [...new Set(xs)].sort()

export function FinancialDataRoom() {
  const navigate = useNavigate()
  const rows = useMemo(() => allFinancialPoints(), [])
  const facets = useMemo(
    () => ({
      competitor: ['Competitor', ...uniq(rows.map((r) => r.competitor))],
      category: ['Category', ...uniq(rows.map((r) => metricCat(r.key)))],
      source: ['Source', ...uniq(rows.map((r) => vendorLabel(r.vendor)))],
    }),
    [rows],
  )
  const FACET_KEYS = Object.keys(facets) as (keyof typeof facets)[]
  const ALL_ALL = Object.fromEntries(FACET_KEYS.map((k) => [k, 'All'])) as Record<string, string>

  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, string>>(ALL_ALL)
  const [sort, setSort] = useState<SortState>({ k: 'competitor', d: 1 })

  const val = (r: FinPointRow, k: string): string | number => {
    if (k === 'competitor') return r.competitor
    if (k === 'cat') return metricCat(r.key)
    if (k === 'metric') return metricLabel(r.key)
    if (k === 'value') return r.value ?? -Infinity
    if (k === 'source') return vendorLabel(r.vendor)
    if (k === 'basis') return r.basis
    if (k === 'period') return r.period
    return ''
  }

  const list = useMemo(() => {
    const qq = q.toLowerCase().trim()
    const out = rows.filter(
      (r) =>
        (sel.competitor === 'All' || r.competitor === sel.competitor) &&
        (sel.category === 'All' || metricCat(r.key) === sel.category) &&
        (sel.source === 'All' || vendorLabel(r.vendor) === sel.source) &&
        (!qq || `${r.competitor} ${metricLabel(r.key)} ${vendorLabel(r.vendor)}`.toLowerCase().includes(qq)),
    )
    const { k, d } = sort
    return [...out].sort((a, b) => {
      const va = val(a, k)
      const vb = val(b, k)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * d
      return String(va).localeCompare(String(vb)) * d
    })
  }, [q, sel, sort, rows])

  const onSort = (k: string) => setSort((s) => (s.k === k ? { k, d: s.d * -1 } : { k, d: k === 'value' ? -1 : 1 }))
  const reset = () => {
    setQ('')
    setSel(ALL_ALL)
  }

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Rooms <b>›</b> Financial Data Room</>}
        title={<>Financial <span className="em">Data Room</span></>}
        sub="Every financial data point across every competitor — one flat feed, each line tagged with the vendor it came from. Filter by competitor, category or source; click a competitor to open its full profile."
        actions={
          <>
            <button className="btn"><ExportIcon />Upload Data</button>
            <button className="btn pri">Request Access</button>
          </>
        }
      />
      <div className="view">
        <div className="filters">
          <div className="frow">
            <div className="room-inp">
              <MagIcon />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search competitor, data point or source…" />
            </div>
            {FACET_KEYS.map((k) => (
              <select key={k} className={`room-sel${sel[k] !== 'All' ? ' act' : ''}`} value={sel[k]} onChange={(e) => setSel((s) => ({ ...s, [k]: e.target.value }))}>
                {facets[k].map((o, i) => (
                  <option key={o} value={i === 0 ? 'All' : o}>{o}</option>
                ))}
              </select>
            ))}
          </div>
          <div className="ffoot">
            <span className="cnt"><b>{list.length}</b> data points · {new Set(list.map((r) => r.competitor)).size} competitors · {new Set(list.map((r) => vendorLabel(r.vendor))).size} sources</span>
            <button className="f-reset" onClick={reset}>Reset filters</button>
          </div>
        </div>

        <Panel title="Data points" action={<button className="btn ghost sm">Export</button>} bodyStyle={{ padding: 0 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {COLS.map(([k, label]) => {
                    const act = sort.k === k
                    const si = act ? (sort.d > 0 ? '▲' : '▼') : '⇅'
                    return (
                      <th key={k} className={`${k === 'value' ? 'num ' : ''}srt${act ? ' act' : ''}`} onClick={() => onSort(k)}>
                        {label}<span className="si">{si}</span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={COLS.length}><div className="room-empty">No matches — try clearing a filter.</div></td></tr>
                ) : (
                  list.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <span className="co-link" onClick={() => navigate(`/rooms/competitor/${encodeURIComponent(r.code)}`)}>
                          <Icon name="building" size={14} />
                          {r.competitor}
                        </span>
                      </td>
                      <td><span className="ac-chip">{metricCat(r.key)}</span></td>
                      <td style={{ fontWeight: 500 }}>{metricLabel(r.key)}</td>
                      <td className="num" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.display}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <span className={`sdot ${TIER_CLASS[vendorTier(r.vendor)]}`} />
                          {vendorLabel(r.vendor)}
                        </span>
                      </td>
                      <td><span className="tk-tick" style={{ textTransform: 'none' }}>{r.basis}</span></td>
                      <td>{r.period}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  )
}
