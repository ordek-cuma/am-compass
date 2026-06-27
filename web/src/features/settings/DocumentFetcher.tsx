// Settings › Data Fetcher › Document Fetcher — operational dashboard for every dedicated
// document fetcher (scraper). Pulls live status from the control server (/api/fetchers):
// competitor, fetch methodology, last run, document count and a health test.
import { useEffect, useMemo, useState } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { Icon } from '../../components/icons'

type Fetcher = { code: string; name: string; method: string; docs: number; lastCrawl: string | null; ok: boolean }

export function DocumentFetcher() {
  const [rows, setRows] = useState<Fetcher[] | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let live = true
    fetch('/api/fetchers')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('offline'))))
      .then((d) => live && setRows(d.fetchers as Fetcher[]))
      .catch(() => live && setOffline(true))
    return () => {
      live = false
    }
  }, [])

  const { total, green } = useMemo(
    () => ({ total: rows?.reduce((a, r) => a + r.docs, 0) ?? 0, green: rows?.filter((r) => r.ok).length ?? 0 }),
    [rows],
  )

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Settings <b>›</b> Data Fetcher <b>›</b> Document Fetcher</>}
        title={<>Document <span className="em">Fetcher</span></>}
        sub="Every dedicated document fetcher (per-competitor scraper), its fetch methodology, last run, document count and health test. Live status from the local control server."
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
      </div>
    </>
  )
}
