// Radar → Competitor Radar. The watchlist of asset managers to monitor, with two lenses:
//   · Monitoring — disclosure regime + data source + fetch status (operational watchlist)
//   · Financials — the ingestion agent's metrics, ranked across the peer set (decision-useful)
// Deep-dives live in the Competitor Data Room.
import { useMemo, useState } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { Icon, MagIcon } from '../../components/icons'
import { CATEGORY_SOURCE, COMPETITORS, CR_FACETS } from '../../data/competitors'
import { financialsFor, fmtMetric, type FinMetric } from '../../data/financials'

type SortState = { k: string; d: number }
type View = 'monitoring' | 'financials'

const MON_COLS: [string, string][] = [
  ['name', 'Competitor'], ['region', 'Region'], ['hq', 'HQ'], ['owner', 'Owner'],
  ['focus', 'Focus'], ['category', 'Category'], ['website', 'Website'],
  ['source', 'Data Source'], ['fetched', 'Last Fetched'], ['status', 'Status'],
]
const MON_SORTABLE = new Set(['name', 'region', 'hq', 'owner', 'focus', 'category'])

// Financials columns map to agent metric_keys; `signed` cells colour by sign.
const FIN_COLS: { k: string; label: string; num: boolean; signed?: boolean }[] = [
  { k: 'name', label: 'Competitor', num: false },
  { k: 'category', label: 'Category', num: false },
  { k: 'aum_total', label: 'Total AuM', num: true },
  { k: 'net_flows', label: 'Net flows', num: true, signed: true },
  { k: 'organic_growth_rate', label: 'Organic growth', num: true, signed: true },
  { k: 'total_revenue', label: 'Revenue', num: true },
  { k: 'operating_margin', label: 'Op margin', num: true, signed: true },
  { k: 'headcount', label: 'Headcount', num: true },
]

const FACET_KEYS = Object.keys(CR_FACETS)
const ALL_ALL = Object.fromEntries(FACET_KEYS.map((k) => [k, 'All'])) as Record<string, string>

// Total-AuM column falls back to average AuM (e.g. Invesco reports the average, not the ending total).
function colMetric(code: string, key: string): FinMetric | undefined {
  const f = financialsFor(code)
  if (!f) return undefined
  if (key === 'aum_total') return f.metrics.aum_total ?? f.metrics.aum_average
  return f.metrics[key]
}

export function CompetitorRadar() {
  const [view, setView] = useState<View>('monitoring')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, string>>(ALL_ALL)
  const [sort, setSort] = useState<SortState>({ k: 'name', d: 1 })

  const list = useMemo(() => {
    const qq = q.toLowerCase().trim()
    const out = COMPETITORS.filter(
      (c) =>
        FACET_KEYS.every((k) => sel[k] === 'All' || String((c as unknown as Record<string, unknown>)[k]) === sel[k]) &&
        (!qq || `${c.name} ${c.code} ${c.hq} ${c.owner} ${c.focus} ${c.website}`.toLowerCase().includes(qq)),
    )
    const { k, d } = sort
    return [...out].sort((a, b) => {
      if (view === 'financials' && k !== 'name' && k !== 'category') {
        const va = colMetric(a.code, k)?.value ?? null
        const vb = colMetric(b.code, k)?.value ?? null
        if (va === null && vb === null) return 0
        if (va === null) return 1 // pending rows sink to the bottom
        if (vb === null) return -1
        return (va - vb) * d
      }
      const va = String((a as unknown as Record<string, string>)[k] ?? '')
      const vb = String((b as unknown as Record<string, string>)[k] ?? '')
      return va.localeCompare(vb) * d
    })
  }, [q, sel, sort, view])

  const cols = view === 'financials' ? FIN_COLS.map((c) => [c.k, c.label] as [string, string]) : MON_COLS
  const isSortable = (k: string) => (view === 'financials' ? true : MON_SORTABLE.has(k))
  const onSort = (k: string) => {
    if (!isSortable(k)) return
    setSort((s) => (s.k === k ? { k, d: s.d * -1 } : { k, d: view === 'financials' && k !== 'name' && k !== 'category' ? -1 : 1 }))
  }
  const switchView = (v: View) => {
    setView(v)
    setSort(v === 'financials' ? { k: 'aum_total', d: -1 } : { k: 'name', d: 1 })
  }
  const reset = () => {
    setQ('')
    setSel(ALL_ALL)
  }
  const withFinancials = list.filter((c) => financialsFor(c.code)).length

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Rooms <b>›</b> Radar <b>›</b> Competitor Radar</>}
        title={<>Competitor <span className="em">Radar</span></>}
        sub="The watchlist of asset managers to monitor. Switch to Financials to rank the peer set on the ingestion agent's metrics. Open a competitor in the Competitor Data Room for the deep-dive."
        actions={
          <>
            <button className="btn"><Icon name="dl" size={15} />Import List</button>
            <button className="btn pri">Add Competitor</button>
          </>
        }
      />
      <div className="view">
        <div className="filters">
          <div className="frow">
            <div className="room-inp">
              <MagIcon />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search competitor, code, HQ…" />
            </div>
            {FACET_KEYS.map((k) => (
              <select key={k} className={`room-sel${sel[k] !== 'All' ? ' act' : ''}`} value={sel[k]} onChange={(e) => setSel((s) => ({ ...s, [k]: e.target.value }))}>
                {CR_FACETS[k].map((o, i) => (
                  <option key={o} value={i === 0 ? 'All' : o}>{o}</option>
                ))}
              </select>
            ))}
          </div>
          <div className="ffoot">
            <span className="cnt"><b>{list.length}</b> competitors{view === 'financials' ? ` · ${withFinancials} with financials` : ''}</span>
            <button className="f-reset" onClick={reset}>Reset filters</button>
          </div>
        </div>

        <Panel
          title={<>Players <span className="muted2">{view === 'financials' ? 'peer financials · ranked' : 'monitoring watchlist'}</span></>}
          action={
            <div className="seg">
              <button className={view === 'monitoring' ? 'on' : ''} onClick={() => switchView('monitoring')}>Monitoring</button>
              <button className={view === 'financials' ? 'on' : ''} onClick={() => switchView('financials')}>Financials</button>
            </div>
          }
          bodyStyle={{ padding: 0 }}
        >
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {cols.map(([k, label], i) => {
                    const sortableCol = isSortable(k)
                    const act = sort.k === k
                    const si = act ? (sort.d > 0 ? '▲' : '▼') : '⇅'
                    const num = view === 'financials' && FIN_COLS[i]?.num
                    return (
                      <th key={k} className={`${num ? 'num ' : ''}${sortableCol ? `srt${act ? ' act' : ''}` : ''}`.trim() || undefined} onClick={() => onSort(k)}>
                        {label}{sortableCol ? <span className="si">{si}</span> : null}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={cols.length}><div className="room-empty">No matches — try clearing a filter.</div></td></tr>
                ) : view === 'financials' ? (
                  list.map((c) => (
                    <tr key={c.code + c.name}>
                      <td>
                        <div style={{ fontWeight: 600 }} title={c.note}>{c.name}</div>
                        <div className="tk-tick">{c.code}</div>
                      </td>
                      <td><span className="chip teal">{c.category}</span></td>
                      {FIN_COLS.slice(2).map((col) => {
                        const m = colMetric(c.code, col.k)
                        const v = m?.value
                        const sign = col.signed && typeof v === 'number' ? (v >= 0 ? ' pos' : ' neg') : ''
                        const isAvg = col.k === 'aum_total' && !financialsFor(c.code)?.metrics.aum_total && !!m
                        return (
                          <td key={col.k} className={`num${sign}`} title={m ? `${m.basis} · conf ${m.confidence} · ${m.section}` : 'pending'}>
                            {m && v != null ? (
                              <>{fmtMetric(m)}{isAvg ? <span className="muted2" style={{ marginLeft: 4 }}>avg</span> : null}</>
                            ) : (
                              <span className="ph">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                ) : (
                  list.map((c) => (
                    <tr key={c.code + c.name}>
                      <td>
                        <div style={{ fontWeight: 600 }} title={c.note}>{c.name}</div>
                        <div className="tk-tick">{c.code}</div>
                      </td>
                      <td><span className="ac-chip">{c.region}</span></td>
                      <td>{c.hq}</td>
                      <td><span className="ac-chip">{c.owner}</span></td>
                      <td><span className="ac-chip">{c.focus}</span></td>
                      <td><span className="chip teal" title={CATEGORY_SOURCE[c.category]}>{c.category}</span></td>
                      <td><a className="doc-link" href={`https://${c.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--teal-ink)', fontWeight: 500 }}>{c.website}</a></td>
                      <td style={{ color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{CATEGORY_SOURCE[c.category]}</td>
                      <td><span className="ph">Never</span></td>
                      <td><span className="badge instance">Not set up</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="sub-note">
            {view === 'financials' ? (
              <>Financials come from the competitor-ingestion agent (SEC EDGAR — US-listed bellwethers in Phase 1). Sort
              any column to rank the peer set; <b>organic growth</b> and <b>op margin</b> normalise away size. Blank rows are
              pending (European/German players land in Phases 2–3). Hover a value for its basis + source.</>
            ) : (
              <><b>Category = disclosure regime</b>, which sets where to fetch each player (Data Source):
              <b> US-listed</b> → SEC EDGAR 10-K; <b>Private / Mutual</b> → Form ADV + fund filings;
              <b> European-listed</b> → Universal Registration Document; <b>German KVG</b> → Bundesanzeiger + Jahresberichte.
              Last Fetched and Status are wired when crawling is connected. Hover a name for ownership notes.</>
            )}
          </div>
        </Panel>
      </div>
    </>
  )
}
