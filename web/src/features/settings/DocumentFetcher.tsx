// Settings › Data Fetcher › Document Fetcher — operational dashboard for every dedicated
// document fetcher (scraper). Pulls live status from the control server (/api/fetchers):
// competitor, fetch methodology, last run, document count and a health test.
import { useEffect, useMemo, useState } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { Icon } from '../../components/icons'

type Fetcher = { code: string; name: string; method: string; docs: number; lastCrawl: string | null; ok: boolean }
type Other = { code: string; name: string; note: string; kind: string; docs: number; lastCrawl: string | null }

export function DocumentFetcher() {
  const [rows, setRows] = useState<Fetcher[] | null>(null)
  const [others, setOthers] = useState<Other[]>([])
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let live = true
    fetch('/api/fetchers')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('offline'))))
      .then((d) => {
        if (!live) return
        setRows(d.fetchers as Fetcher[])
        setOthers((d.others as Other[]) ?? [])
      })
      .catch(() => live && setOffline(true))
    return () => {
      live = false
    }
  }, [])

  const { total, green } = useMemo(
    () => ({ total: rows?.reduce((a, r) => a + r.docs, 0) ?? 0, green: rows?.filter((r) => r.ok).length ?? 0 }),
    [rows],
  )
  const tracked = (rows?.length ?? 0) + others.length

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Settings <b>›</b> Data Fetcher <b>›</b> Document Fetcher</>}
        title={<>Document <span className="em">Fetcher</span></>}
        sub={
          rows
            ? `${tracked} competitors tracked · ${rows.length} dedicated fetchers, ${others.length} inherited or overlay-only. Methodology, last run, document count and health test — live from the local control server.`
            : 'Every dedicated document fetcher (per-competitor scraper), its fetch methodology, last run, document count and health test. Live status from the local control server.'
        }
      />
      <div className="view">
        {offline ? (
          <Panel title="Status">
            <div className="room-empty">
              Fetch server offline — run <code>python3 -m competitor_ingest.server</code> in <code>spike/</code> to see live status.
            </div>
          </Panel>
        ) : (
          <Panel
            title={
              <>
                Fetchers{' '}
                <span className="muted2">
                  {rows ? `${rows.length} scrapers · ${green} healthy · ${total} documents` : 'loading…'}
                </span>
              </>
            }
            bodyStyle={{ padding: 0 }}
          >
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Competitor</th>
                    <th>Methodology</th>
                    <th>Last Fetch</th>
                    <th className="num">Documents</th>
                    <th>Tests</th>
                  </tr>
                </thead>
                <tbody>
                  {!rows ? (
                    <tr>
                      <td colSpan={5}><div className="room-empty">Loading fetcher status…</div></td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.code}>
                        <td>
                          <span className="co-link">
                            <Icon name="building" size={14} />
                            {r.name}
                          </span>
                          <div className="tk-tick">{r.code}</div>
                        </td>
                        <td style={{ color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{r.method}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {r.lastCrawl ? r.lastCrawl.slice(0, 10) : <span className="ph">Never</span>}
                        </td>
                        <td className="num">{r.docs}</td>
                        <td>
                          <span className={`badge ${r.ok ? 'live' : 'alert'}`}>{r.ok ? '● Green' : '○ Pending'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="sub-note">
              <b>Methodology</b> is how each competitor's documents are fetched — headless render + stdlib download, real-Chrome
              render, or in-session browser-download for WAF/Akamai-protected asset hosts. <b>Tests</b> is green when the fetcher's
              archive holds documents; a pending fetcher has been registered but not yet crawled (or its source yielded nothing).
            </div>
          </Panel>
        )}

        {!offline && others.length > 0 ? (
          <Panel
            title={<>Inherited / overlay-only <span className="muted2">{others.length} competitors · no dedicated fetcher</span></>}
            bodyStyle={{ padding: 0 }}
          >
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Competitor</th>
                    <th>Coverage</th>
                    <th className="num">Documents</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {others.map((o) => (
                    <tr key={o.code}>
                      <td>
                        <span className="co-link">
                          <Icon name="building" size={14} />
                          {o.name}
                        </span>
                        <div className="tk-tick">{o.code}</div>
                      </td>
                      <td style={{ color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{o.note}</td>
                      <td className="num">{o.docs || <span className="ph">—</span>}</td>
                      <td>
                        <span className={`badge ${o.kind === 'covered' ? 'system' : o.kind === 'overlay' ? 'instance' : 'draft'}`}>
                          {o.kind === 'covered' ? 'Inherited' : o.kind === 'overlay' ? 'Overlay-only' : 'No source'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sub-note">
              These competitors have no dedicated fetcher: <b>Inherited</b> = documents come from a parent already fetched (PIMCO
              via Allianz, Deka Immobilien via DekaBank); <b>Overlay-only</b> = tracked on financial numbers, parent rollup not
              crawled; <b>No source</b> = no public document source (Universal Investment's accounts are Bundesanzeiger-only,
              captcha-gated).
            </div>
          </Panel>
        ) : null}
      </div>
    </>
  )
}
