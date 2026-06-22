// Product Data Room — screener (spec §7.1). One row per fund; 13 facet filters + free-text
// search, sortable table, default sort Fund Size desc. Row click drills into the fund.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { ExportIcon, FileMiniIcon, MagIcon } from '../../components/icons'
import { FACETS, FUNDS } from '../../data/funds'
import type { Fund } from '../../data/types'
import { fnum, fpct } from '../../lib/format'

type SortState = { k: string; d: number }
const NUM_KEYS = new Set(['size', 'cost', 'y1', 'docs', 'classes'])
const COLS: [string, string, ('num' | undefined)?][] = [
  ['n', 'Fund'],
  ['structure', 'Structure'],
  ['ccy', 'Currency'],
  ['dist', 'Distribution'],
  ['size', 'Fund Size (M USD)', 'num'],
  ['cost', 'TER (%)', 'num'],
  ['y1', '1Y p.a. (%)', 'num'],
  ['classes', 'Classes', 'num'],
  ['docs', '# of Docs', 'num'],
]
const FACET_KEYS = Object.keys(FACETS)
const ALL_ALL = Object.fromEntries(FACET_KEYS.map((k) => [k, 'All'])) as Record<string, string>

export function ProductScreener() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, string>>(ALL_ALL)
  const [sort, setSort] = useState<SortState>({ k: 'size', d: -1 })

  const list = useMemo(() => {
    const qq = q.toLowerCase().trim()
    let out = FUNDS.filter(
      (f) =>
        FACET_KEYS.every((k) => {
          const v = sel[k]
          if (v === 'All') return true
          if (k === 'ccy') return f.classes.some((c) => c.ccy === v)
          if (k === 'dist') return f.classes.some((c) => c.dist === v)
          return String((f as unknown as Record<string, unknown>)[k]) === v
        }) && (!qq || `${f.n} ${f.t} ${f.isin} ${f.fundId}`.toLowerCase().includes(qq)),
    )
    const { k, d } = sort
    out = [...out].sort((a, b) => {
      let va: string | number = (a as unknown as Record<string, string | number>)[k]
      let vb: string | number = (b as unknown as Record<string, string | number>)[k]
      if (k === 'docs') {
        va = 5
        vb = 5
      }
      if (k === 'classes') {
        va = a.classes.length
        vb = b.classes.length
      }
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * d
      return String(va).localeCompare(String(vb)) * d
    })
    return out
  }, [q, sel, sort])

  const onSort = (k: string) =>
    setSort((s) => (s.k === k ? { k, d: s.d * -1 } : { k, d: NUM_KEYS.has(k) ? -1 : 1 }))
  const reset = () => {
    setQ('')
    setSel(ALL_ALL)
  }
  const open = (f: Fund) => navigate(`/rooms/product/${f.fundId}`)

  return (
    <>
      <ModuleHeader
        crumb={
          <>
            Compass <b>›</b> Rooms <b>›</b> Product Data Room
          </>
        }
        title={
          <>
            Product <span className="em">Data Room</span>
          </>
        }
        sub="One row per fund. Filter and sort the universe, then open a fund for its share classes, listings, holdings, measures, and documents."
        actions={
          <>
            <button className="btn">
              <ExportIcon />
              Upload
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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search funds, tickers, ISIN…" />
            </div>
            {FACET_KEYS.map((k) => (
              <select
                key={k}
                className={`room-sel${sel[k] !== 'All' ? ' act' : ''}`}
                value={sel[k]}
                onChange={(e) => setSel((s) => ({ ...s, [k]: e.target.value }))}
              >
                {FACETS[k].map((o, i) => (
                  <option key={o} value={i === 0 ? 'All' : o}>
                    {o}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <div className="ffoot">
            <span className="cnt">
              <b>{list.length}</b> funds
            </span>
            <button className="f-reset" onClick={reset}>
              Reset filters
            </button>
          </div>
        </div>

        <Panel title="Funds" action={<button className="btn ghost sm">Export</button>} bodyStyle={{ padding: 0 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {COLS.map(([k, label, num]) => {
                    const act = sort.k === k
                    const si = act ? (sort.d > 0 ? '▲' : '▼') : '⇅'
                    return (
                      <th key={k} className={`${num ? 'num ' : ''}srt${act ? ' act' : ''}`} onClick={() => onSort(k)}>
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
                    <td colSpan={9}>
                      <div className="room-empty">No matches — try clearing a filter.</div>
                    </td>
                  </tr>
                ) : (
                  list.map((f) => (
                    <tr className="prow" key={f.fundId} onClick={() => open(f)}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{f.n}</div>
                        <div className="tk-tick">
                          {f.t} · {f.fundId}
                        </div>
                      </td>
                      <td>{f.structure}</td>
                      <td>{f.ccy}</td>
                      <td>{f.dist === 'Accumulating' ? 'Acc' : 'Dist'}</td>
                      <td className="num">{fnum(f.size)}</td>
                      <td className="num">{f.cost.toFixed(2)}</td>
                      <td className={`num ${f.y1 >= 0 ? 'pos' : 'neg'}`}>{fpct(f.y1)}</td>
                      <td className="num">{f.classes.length}</td>
                      <td className="num">
                        <span className="docpill">
                          <FileMiniIcon /> 5
                        </span>
                      </td>
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
