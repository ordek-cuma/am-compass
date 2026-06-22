// Company Data Room — screener (spec §8.1). One row per document across all companies.
// The row is NOT clickable: company-name → detail, document-name → preview, dl-icon → download.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { useUi } from '../../components/ui-context'
import { DlIcon, ExportIcon, Icon, MagIcon } from '../../components/icons'
import { CFACETS, COMPANIES, companyRows } from '../../data/companies'
import { fdate, szKB } from '../../lib/format'

type SortState = { k: string; d: number }
const COLS: [string, string][] = [
  ['co', 'Competitor'],
  ['seg', 'Focus'],
  ['cat', 'Category'],
  ['doc', 'Document'],
  ['fmt', 'Format'],
  ['date', 'Date'],
  ['sz', 'Size'],
]
const FACET_KEYS = Object.keys(CFACETS)
const ALL_ALL = Object.fromEntries(FACET_KEYS.map((k) => [k, 'All'])) as Record<string, string>

export function CompanyScreener() {
  const navigate = useNavigate()
  const { openPreview, downloadDoc } = useUi()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, string>>(ALL_ALL)
  const [sort, setSort] = useState<SortState>({ k: 'co', d: 1 })

  const list = useMemo(() => {
    const qq = q.toLowerCase().trim()
    let out = companyRows().filter(
      (r) =>
        FACET_KEYS.every((k) => {
          const v = sel[k]
          if (v === 'All') return true
          if (k === 'yr') return r.date.slice(0, 4) === v
          return String((r as unknown as Record<string, unknown>)[k]) === v
        }) && (!qq || `${r.co} ${r.doc} ${r.cat} ${r.seg}`.toLowerCase().includes(qq)),
    )
    const { k, d } = sort
    out = [...out].sort((a, b) => {
      let va: string | number = (a as unknown as Record<string, string>)[k]
      let vb: string | number = (b as unknown as Record<string, string>)[k]
      if (k === 'sz') {
        va = szKB(a.sz)
        vb = szKB(b.sz)
      }
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * d
      return String(va).localeCompare(String(vb)) * d
    })
    return out
  }, [q, sel, sort])

  const onSort = (k: string) => setSort((s) => (s.k === k ? { k, d: s.d * -1 } : { k, d: k === 'date' || k === 'sz' ? -1 : 1 }))
  const reset = () => {
    setQ('')
    setSel(ALL_ALL)
  }
  const openCompany = (co: string) => {
    const c = COMPANIES.find((x) => x.co === co)
    if (c) navigate(`/rooms/competitor/${encodeURIComponent(c.tick)}`)
  }

  return (
    <>
      <ModuleHeader
        crumb={
          <>
            Compass <b>›</b> Rooms <b>›</b> Competitor Data Room
          </>
        }
        title={
          <>
            Competitor <span className="em">Data Room</span>
          </>
        }
        sub="Documents across every competitor you track — the deep-dive home for the Radar watchlist. Filter, sort, and click a competitor to open its profile and full document set."
        actions={
          <>
            <button className="btn">
              <ExportIcon />
              Upload Document
            </button>
            <button className="btn pri">Request Access</button>
          </>
        }
      />
      <div className="view">
        <div className="filters">
          <div className="frow">
            <div className="room-inp">
              <MagIcon />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, document, category…" />
            </div>
            {FACET_KEYS.map((k) => (
              <select
                key={k}
                className={`room-sel${sel[k] !== 'All' ? ' act' : ''}`}
                value={sel[k]}
                onChange={(e) => setSel((s) => ({ ...s, [k]: e.target.value }))}
              >
                {CFACETS[k].map((o, i) => (
                  <option key={o} value={i === 0 ? 'All' : o}>
                    {o}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <div className="ffoot">
            <span className="cnt">
              <b>{list.length}</b> documents
            </span>
            <button className="f-reset" onClick={reset}>
              Reset filters
            </button>
          </div>
        </div>

        <Panel title="Documents" action={<button className="btn ghost sm">Export</button>} bodyStyle={{ padding: 0 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {COLS.map(([k, label]) => {
                    const act = sort.k === k
                    const si = act ? (sort.d > 0 ? '▲' : '▼') : '⇅'
                    return (
                      <th key={k} className={`srt${act ? ' act' : ''}`} onClick={() => onSort(k)}>
                        {label}
                        <span className="si">{si}</span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="room-empty">No matches — try clearing a filter.</div>
                    </td>
                  </tr>
                ) : (
                  list.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <span className="co-link" onClick={() => openCompany(r.co)}>
                          <Icon name="building" size={14} />
                          {r.co}
                        </span>
                      </td>
                      <td>
                        <span className="ac-chip">{r.seg}</span>
                      </td>
                      <td>{r.cat}</td>
                      <td>
                        <span className="doc-cell">
                          <span
                            className="doc-link"
                            onClick={() => openPreview(r.doc, r.fmt, `${r.co} · ${r.cat} · ${fdate(r.date)} · ${r.sz}`)}
                          >
                            {r.doc}
                          </span>
                          <span className="dlm" title="Download" onClick={() => downloadDoc(r.doc, r.fmt)}>
                            <DlIcon />
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className={`fmt ${r.fmt.toLowerCase()}`}>{r.fmt}</span>
                      </td>
                      <td>{fdate(r.date)}</td>
                      <td>{r.sz}</td>
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
