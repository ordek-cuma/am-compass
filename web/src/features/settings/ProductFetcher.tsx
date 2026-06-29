// Settings › Data Fetcher › Product Fetcher — the source playbook as a matrix: the same
// competitor × product type / group grid as Product Coverage, but each box shows WHERE that data
// is fetched from (stockanalysis / Morningstar / justETF / finanzen.net / fund centre / SEC
// filings), colour-coded by source family. The source is shown for every applicable cell — even
// where we're confident the manager offers no products in that area (that's still the source of
// record where we'd confirm it). Only a true Master-KVG with no own range shows "n/a".
import { useMemo } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { buildFirms, COLUMNS, SRC, srcNote, type SrcKey } from './productMatrix'

export function ProductFetcher() {
  const firms = useMemo(() => buildFirms(), [])
  const usedSrc = (Object.keys(SRC) as SrcKey[]).filter((k) => firms.some((f) => f.cells.some((c) => c.src === k)))

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Settings <b>›</b> Data Fetcher <b>›</b> Product Fetcher</>}
        title={<>Product <span className="em">Fetcher</span></>}
        sub={`Where each competitor's product data is fetched from, by product type & group — the source playbook behind the Product Coverage matrix. Each box shows the source of record (shown even where a line is a confirmed structural zero); "n/a" marks a Master-KVG with no own products.`}
      />
      <div className="view">
        <Panel title={<>Data sources <span className="muted2">{usedSrc.length} source families · how the catalogue is built</span></>}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5 }}>
            {usedSrc.map((k) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: SRC[k].color, display: 'inline-block' }} />
                <span className="muted2">{SRC[k].label}</span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={<>Source matrix <span className="muted2">competitor × product type / group · where to fetch the data</span></>} bodyStyle={{ padding: 0 }}>
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
                {firms.map((f) => {
                  const note = srcNote(f.code)
                  return (
                    <tr key={f.code}>
                      <td style={{ position: 'sticky', left: 0, background: 'var(--surface-1)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {f.name}
                        <span className="muted2" style={{ marginLeft: 6, fontSize: 11 }}>{f.code}</span>
                      </td>
                      {f.cells.map((cell, i) => {
                        const meta = SRC[cell.src]
                        return (
                          <td key={COLUMNS[i].key} style={{ textAlign: 'center', padding: '4px 6px' }}>
                            <span
                              title={`${COLUMNS[i].label} → ${meta.label}${cell.n === 0 ? (f.sure ? ' · confirmed no products here (source of record)' : ' · not yet ingested') : ` · ${cell.n} product${cell.n === 1 ? '' : 's'}`}\n${note}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                minWidth: 26, height: 24, padding: '0 8px', borderRadius: 5,
                                background: meta.color, color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                                // dim the chip a touch where it's a confirmed structural zero (source of record, but nothing to pull)
                                opacity: cell.n === 0 && f.sure ? 0.55 : 1,
                              }}
                            >
                              {meta.label}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  )
}
