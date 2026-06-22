// Radar → Competitor Radar. The watchlist of asset-management players to monitor — a flat,
// filterable/sortable list (NOT a deep-dive; deep-dives live in the Company Data Room).
// Operational columns (data source, last fetched, status) are placeholders to be wired later.
import { useMemo, useState } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { Icon, MagIcon } from '../../components/icons'
import { CATEGORY_SOURCE, COMPETITORS, CR_FACETS } from '../../data/competitors'

type SortState = { k: string; d: number }
const COLS: [string, string][] = [
  ['name', 'Competitor'],
  ['region', 'Region'],
  ['hq', 'HQ'],
  ['owner', 'Owner'],
  ['focus', 'Focus'],
  ['category', 'Category'],
  ['website', 'Website'],
  ['source', 'Data Source'],
  ['fetched', 'Last Fetched'],
  ['status', 'Status'],
]
const FACET_KEYS = Object.keys(CR_FACETS)
const ALL_ALL = Object.fromEntries(FACET_KEYS.map((k) => [k, 'All'])) as Record<string, string>

export function CompetitorRadar() {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, string>>(ALL_ALL)
  const [sort, setSort] = useState<SortState>({ k: 'name', d: 1 })

  const list = useMemo(() => {
    const qq = q.toLowerCase().trim()
    let out = COMPETITORS.filter(
      (c) =>
        FACET_KEYS.every((k) => sel[k] === 'All' || String((c as unknown as Record<string, unknown>)[k]) === sel[k]) &&
        (!qq || `${c.name} ${c.code} ${c.hq} ${c.owner} ${c.focus} ${c.website}`.toLowerCase().includes(qq)),
    )
    const { k, d } = sort
    // Only the data-backed columns are sortable; operational placeholders are uniform.
    out = [...out].sort((a, b) => {
      const va = String((a as unknown as Record<string, string>)[k] ?? '')
      const vb = String((b as unknown as Record<string, string>)[k] ?? '')
      return va.localeCompare(vb) * d
    })
    return out
  }, [q, sel, sort])

  const sortable = new Set(['name', 'region', 'hq', 'owner', 'focus', 'category'])
  const onSort = (k: string) => {
    if (!sortable.has(k)) return
    setSort((s) => (s.k === k ? { k, d: s.d * -1 } : { k, d: 1 }))
  }
  const reset = () => {
    setQ('')
    setSel(ALL_ALL)
  }

  return (
    <>
      <ModuleHeader
        crumb={
          <>
            Compass <b>›</b> Rooms <b>›</b> Radar <b>›</b> Competitor Radar
          </>
        }
        title={
          <>
            Competitor <span className="em">Radar</span>
          </>
        }
        sub="The watchlist of asset managers to monitor. Each row is a player to track — its data source, fetch cadence and status are configured here (wired later). Open a company in the Company Data Room for the deep-dive."
        actions={
          <>
            <button className="btn">
              <Icon name="dl" size={15} />
              Import List
            </button>
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
              <select
                key={k}
                className={`room-sel${sel[k] !== 'All' ? ' act' : ''}`}
                value={sel[k]}
                onChange={(e) => setSel((s) => ({ ...s, [k]: e.target.value }))}
              >
                {CR_FACETS[k].map((o, i) => (
                  <option key={o} value={i === 0 ? 'All' : o}>
                    {o}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <div className="ffoot">
            <span className="cnt">
              <b>{list.length}</b> competitors
            </span>
            <button className="f-reset" onClick={reset}>
              Reset filters
            </button>
          </div>
        </div>

        <Panel
          title={
            <>
              Players <span className="muted2">monitoring watchlist · deep-dives in Company Data Room</span>
            </>
          }
          action={<button className="btn ghost sm">Export</button>}
          bodyStyle={{ padding: 0 }}
        >
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {COLS.map(([k, label]) => {
                    const isSortable = sortable.has(k)
                    const act = sort.k === k
                    const si = act ? (sort.d > 0 ? '▲' : '▼') : '⇅'
                    return (
                      <th key={k} className={isSortable ? `srt${act ? ' act' : ''}` : undefined} onClick={() => onSort(k)}>
                        {label}
                        {isSortable ? <span className="si">{si}</span> : null}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length}>
                      <div className="room-empty">No matches — try clearing a filter.</div>
                    </td>
                  </tr>
                ) : (
                  list.map((c) => (
                    <tr key={c.code + c.name}>
                      <td>
                        <div style={{ fontWeight: 600 }} title={c.note}>
                          {c.name}
                        </div>
                        <div className="tk-tick">{c.code}</div>
                      </td>
                      <td>
                        <span className="ac-chip">{c.region}</span>
                      </td>
                      <td>{c.hq}</td>
                      <td>
                        <span className="ac-chip">{c.owner}</span>
                      </td>
                      <td>
                        <span className="ac-chip">{c.focus}</span>
                      </td>
                      <td>
                        <span className="chip teal" title={CATEGORY_SOURCE[c.category]}>
                          {c.category}
                        </span>
                      </td>
                      <td>
                        <a
                          className="doc-link"
                          href={`https://${c.website}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--teal-ink)', fontWeight: 500 }}
                        >
                          {c.website}
                        </a>
                      </td>
                      <td style={{ color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{CATEGORY_SOURCE[c.category]}</td>
                      <td>
                        <span className="ph">Never</span>
                      </td>
                      <td>
                        <span className="badge instance">Not set up</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="sub-note">
            <b>Category = disclosure regime</b>, which sets where to fetch each player (shown in Data Source):
            <b> US-listed</b> → SEC EDGAR 10-K (group filers like MS/GS/JPM/PGIM/State Street via the parent);
            <b> Private / Mutual</b> (Vanguard, Fidelity, PIMCO) → thin corporate disclosure, lean on Form ADV + fund filings;
            <b> European-listed</b> (Amundi, UBS, BNP, Allianz, Natixis, AXA, Swiss Life) → Universal Registration Document;
            <b> German KVG</b> (Union, Deka, MEAG, Universal, BayernInvest, HSBC INKA) → Bundesanzeiger + fund Jahresberichte + Master-/Service-KVG brochures.
            Last Fetched and Status are operational fields wired when crawling is connected. Hover a name for ownership notes.
          </div>
        </Panel>
      </div>
    </>
  )
}
