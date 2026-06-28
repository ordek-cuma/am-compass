// Reusable product screener body: facet filters + free-text search + sortable table.
// Used by the full Product Data Room (all products) and by each competitor's Products tab
// (scoped to that manager's products). Facet options are derived from the products passed in.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Panel } from '../../components/Panel'
import { MagIcon } from '../../components/icons'
import type { Product } from '../../data/products'
import { fnum, fpct } from '../../lib/format'

type SortState = { k: keyof Product; d: number }
const NUM_KEYS = new Set<keyof Product>(['aum', 'ter', 'perf1y', 'perf3y', 'perf5y', 'yield'])

const FACET_DEFS: [keyof Product, string][] = [
  ['vehicle', 'Vehicle'],
  ['brand', 'Brand'],
  ['assetClass', 'Asset Class'],
  ['subAssetClass', 'Sub-Asset Class'],
  ['region', 'Exposure Region'],
  ['marketType', 'Market'],
  ['style', 'Style'],
  ['listing', 'Listing'],
  ['sfdr', 'SFDR'],
  ['esg', 'ESG'],
  ['ccy', 'Currency'],
  ['domicile', 'Domicile'],
]

const COLS: [keyof Product, string, ('num' | undefined)?][] = [
  ['name', 'Product'],
  ['vehicle', 'Vehicle'],
  ['assetClass', 'Asset Class'],
  ['region', 'Region'],
  ['listing', 'Listing'],
  ['ter', 'TER %', 'num'],
  ['aum', 'AUM ($M)', 'num'],
  ['perf1y', '1Y p.a. %', 'num'],
  ['yield', 'Yield %', 'num'],
]

function fmtAum(m: number | null): string {
  if (m == null) return '—'
  if (m >= 1000) return fnum(Math.round(m))
  return m.toFixed(1)
}

export function ProductTable({ products, title = 'Products' }: { products: Product[]; title?: string }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<SortState>({ k: 'aum', d: -1 })

  // Facet option lists, derived from THIS product set (most frequent first), so a competitor
  // tab only offers the cuts that exist for that manager.
  const facets = useMemo(() => {
    const out: Record<string, string[]> = {}
    for (const [k] of FACET_DEFS) {
      const counts = new Map<string, number>()
      for (const p of products) {
        const v = String(p[k] ?? '')
        if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
      }
      out[k] = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v)
    }
    return out
  }, [products])

  const list = useMemo(() => {
    const qq = q.toLowerCase().trim()
    let out = products.filter(
      (p) =>
        FACET_DEFS.every(([k]) => {
          const v = sel[k]
          return !v || v === 'All' || String(p[k]) === v
        }) && (!qq || `${p.name} ${p.ticker} ${p.isin}`.toLowerCase().includes(qq)),
    )
    const { k, d } = sort
    out = [...out].sort((a, b) => {
      const va = a[k] as string | number | null
      const vb = b[k] as string | number | null
      if (typeof va === 'number' || typeof vb === 'number') {
        return (((va as number) ?? -Infinity) - ((vb as number) ?? -Infinity)) * d
      }
      return String(va ?? '').localeCompare(String(vb ?? '')) * d
    })
    return out
  }, [products, q, sel, sort])

  const onSort = (k: keyof Product) =>
    setSort((s) => (s.k === k ? { k, d: s.d * -1 } : { k, d: NUM_KEYS.has(k) ? -1 : 1 }))
  const reset = () => {
    setQ('')
    setSel({})
  }
  const activeFacets = FACET_DEFS.filter(([k]) => (facets[k] ?? []).length > 1)

  return (
    <>
      <div className="filters">
        <div className="frow">
          <div className="room-inp">
            <MagIcon />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, tickers, ISIN…" />
          </div>
          {activeFacets.map(([k, label]) => (
            <select
              key={k}
              className={`room-sel${sel[k] && sel[k] !== 'All' ? ' act' : ''}`}
              value={sel[k] ?? 'All'}
              onChange={(e) => setSel((s) => ({ ...s, [k]: e.target.value }))}
            >
              <option value="All">{label}</option>
              {(facets[k] ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ))}
        </div>
        <div className="ffoot">
          <span className="cnt">
            <b>{fnum(list.length)}</b> products
          </span>
          <button className="f-reset" onClick={reset}>
            Reset filters
          </button>
        </div>
      </div>

      <Panel title={title} action={<button className="btn ghost sm">Export</button>} bodyStyle={{ padding: 0 }}>
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
                  <td colSpan={COLS.length}>
                    <div className="room-empty">No matches — try clearing a filter.</div>
                  </td>
                </tr>
              ) : (
                list.slice(0, 600).map((p) => (
                  <tr className="prow" key={p.isin} onClick={() => navigate(`/rooms/product/${p.isin}`)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="tk-tick">
                        {p.ticker && p.ticker !== p.isin ? `${p.ticker} · ${p.isin}` : p.ticker || p.isin}
                      </div>
                    </td>
                    <td>
                      <span className="ac-chip">{p.vehicle}</span>
                    </td>
                    <td>{p.assetClass}</td>
                    <td>{p.region}</td>
                    <td>{p.listing}</td>
                    <td className="num">{p.ter != null ? p.ter.toFixed(2) : '—'}</td>
                    <td className="num">{fmtAum(p.aum)}</td>
                    <td className={`num ${p.perf1y != null ? (p.perf1y >= 0 ? 'pos' : 'neg') : ''}`}>
                      {p.perf1y != null ? fpct(p.perf1y) : '—'}
                    </td>
                    <td className="num">{p.yield != null ? p.yield.toFixed(2) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {list.length > 600 ? (
          <div className="sub-note" style={{ padding: '8px 14px' }}>
            Showing the top 600 of {fnum(list.length)} matches by current sort — narrow with filters or search.
          </div>
        ) : null}
      </Panel>
    </>
  )
}
