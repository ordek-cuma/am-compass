// Document Data Room — one row per REAL document across every competitor (crawled local
// files + primary-source links from the ingestion agent). No placeholders. Three click
// targets: competitor → detail, document → preview/open, ⬇ → download/open-at-source.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { useUi } from '../../components/ui-context'
import { DlIcon, ExportIcon, Icon, MagIcon } from '../../components/icons'
import { allDocuments, fmtBytes, type DocRow } from '../../data/financials'
import { fdate } from '../../lib/format'

type SortState = { k: string; d: number }
const COLS: [string, string][] = [
  ['competitor', 'Competitor'],
  ['regime', 'Regime'],
  ['name', 'Document'],
  ['type', 'Type'],
  ['form', 'Form'],
  ['date', 'Date'],
  ['size', 'Size'],
]
const uniq = (xs: string[]) => [...new Set(xs)].sort()

export function CompanyScreener() {
  const navigate = useNavigate()
  const { openPreview, downloadDoc } = useUi()
  const rows = useMemo(() => allDocuments(), [])
  const facets = useMemo(
    () => ({
      competitor: ['Competitor', ...uniq(rows.map((r) => r.competitor))],
      regime: ['Regime', ...uniq(rows.map((r) => r.regime))],
      type: ['Type', 'Crawled', 'Source'],
    }),
    [rows],
  )
  const FACET_KEYS = Object.keys(facets) as (keyof typeof facets)[]
  const ALL_ALL = Object.fromEntries(FACET_KEYS.map((k) => [k, 'All'])) as Record<string, string>

  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, string>>(ALL_ALL)
  const [sort, setSort] = useState<SortState>({ k: 'competitor', d: 1 })

  const val = (r: DocRow, k: string): string | number => {
    if (k === 'competitor') return r.competitor
    if (k === 'regime') return r.regime
    if (k === 'type') return r.type
    if (k === 'size') return r.doc.sizeBytes
    if (k === 'name') return r.doc.name
    if (k === 'form') return r.doc.form
    if (k === 'date') return r.doc.date
    return ''
  }

  const list = useMemo(() => {
    const qq = q.toLowerCase().trim()
    const out = rows.filter(
      (r) =>
        (sel.competitor === 'All' || r.competitor === sel.competitor) &&
        (sel.regime === 'All' || r.regime === sel.regime) &&
        (sel.type === 'All' || r.type === sel.type) &&
        (!qq || `${r.competitor} ${r.doc.name} ${r.doc.form}`.toLowerCase().includes(qq)),
    )
    const { k, d } = sort
    return [...out].sort((a, b) => {
      const va = val(a, k)
      const vb = val(b, k)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * d
      return String(va).localeCompare(String(vb)) * d
    })
  }, [q, sel, sort, rows])

  const onSort = (k: string) => setSort((s) => (s.k === k ? { k, d: s.d * -1 } : { k, d: k === 'date' || k === 'size' ? -1 : 1 }))
  const reset = () => {
    setQ('')
    setSel(ALL_ALL)
  }
  const openDoc = (r: DocRow) =>
    openPreview(r.doc.name, r.doc.fmt, `${r.competitor} · ${r.doc.form} · ${fdate(r.doc.date)}`, {
      file: r.doc.file || undefined,
      edgarUrl: r.doc.edgarUrl || undefined,
    })
  const dl = (r: DocRow) => {
    if (r.doc.file) downloadDoc(r.doc.name, r.doc.fmt, `/${r.doc.file}`)
    else if (r.doc.edgarUrl) window.open(r.doc.edgarUrl, '_blank', 'noopener')
  }

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Rooms <b>›</b> Document Data Room</>}
        title={<>Document <span className="em">Data Room</span></>}
        sub="Every crawled & sourced document across every competitor — one flat feed. Click a document to preview/open, or a competitor to open its full profile."
        actions={
          <>
            <button className="btn"><ExportIcon />Upload Document</button>
            <button className="btn pri">Request Access</button>
          </>
        }
      />
      <div className="view">
        <div className="filters">
          <div className="frow">
            <div className="room-inp">
              <MagIcon />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search competitor or document…" />
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
            <span className="cnt"><b>{list.length}</b> documents · {rows.filter((r) => r.type === 'Crawled').length} crawled</span>
            <button className="f-reset" onClick={reset}>Reset filters</button>
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
                      <th key={k} className={`${k === 'size' ? 'num ' : ''}srt${act ? ' act' : ''}`} onClick={() => onSort(k)}>
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
                      <td><span className="ac-chip">{r.regime}</span></td>
                      <td>
                        <span className="doc-cell">
                          <span className="doc-link" onClick={() => openDoc(r)}>{r.doc.name}</span>
                          <span className="dlm" title={r.doc.file ? 'Download' : 'Open at source'} onClick={() => dl(r)}>
                            <DlIcon />
                          </span>
                        </span>
                      </td>
                      <td><span className={`badge ${r.type === 'Crawled' ? 'live' : 'system'}`}>{r.type}</span></td>
                      <td>{r.doc.form}</td>
                      <td>{fdate(r.doc.date)}</td>
                      <td className="num">{r.doc.sizeBytes ? fmtBytes(r.doc.sizeBytes) : '—'}</td>
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
