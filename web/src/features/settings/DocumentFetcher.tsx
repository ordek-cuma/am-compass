// Settings › Data Fetcher › Document Fetcher — the document source playbook as a matrix (mirrors
// Product / Financial Fetcher): competitor × the document types they should disclose, each box
// showing WHERE that document is fetched from and HOW (source + methodology), driven by the
// competitor's disclosure regime. Below the matrix, the live scraper-status panels show what each
// dedicated fetcher has actually pulled (from the local control server).
import { useEffect, useMemo, useState } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { Icon } from '../../components/icons'
import { COMPETITORS } from '../../data/competitors'

// ── Document source families (where + how) ───────────────────────────────────────────
type DocSrc = 'edgar' | 'iapd' | 'ir' | 'fundcentre' | 'banz' | 'na'
const DSRC: Record<DocSrc, { label: string; color: string; method: string }> = {
  edgar: { label: 'SEC EDGAR', color: '#2f6fb0', method: 'open filings — stdlib HTTP download' },
  iapd: { label: 'SEC IAPD', color: '#6f9a33', method: 'Form ADV via adviserinfo.sec.gov — stdlib download' },
  ir: { label: 'Company IR site', color: '#3b8a8a', method: 'headless render + download; real-Chrome render where WAF-protected' },
  fundcentre: { label: 'Fund document centre', color: '#7a52b3', method: 'in-session browser download (Akamai / WAF-protected asset hosts)' },
  banz: { label: 'Bundesanzeiger', color: '#c08a23', method: 'German statutory register — some captcha-gated (manual)' },
  na: { label: 'n/a', color: '#566070', method: 'not part of this competitor’s disclosure regime' },
}

type Col = { key: string; label: string }
const GROUPS: { group: string; cols: Col[] }[] = [
  { group: 'Corporate', cols: [
    { key: 'annual', label: 'Annual report' }, { key: 'interim', label: 'Interim / H1' }, { key: 'deck', label: 'Earnings deck' },
  ] },
  { group: 'Regulatory', cols: [
    { key: 'adv', label: 'Form ADV' }, { key: 'banz', label: 'Statutory filing' },
  ] },
  { group: 'Fund documents', cols: [
    { key: 'prospectus', label: 'Prospectus / KID' }, { key: 'factsheet', label: 'Factsheet' },
  ] },
  { group: 'ESG & comms', cols: [
    { key: 'esg', label: 'ESG / SFDR' }, { key: 'press', label: 'Press release' },
  ] },
]
const FLAT: Col[] = GROUPS.flatMap((g) => g.cols)
const LISTED = new Set(['US-listed', 'European-listed'])
const US = new Set(['US-listed', 'Private / Mutual'])

// What document a competitor should have for a given column, and where it comes from — by regime.
function docCell(cat: string, key: string): { src: DocSrc; doc: string } {
  const na = { src: 'na' as DocSrc, doc: 'not applicable to this regime' }
  switch (key) {
    case 'annual':
      if (cat === 'US-listed') return { src: 'edgar', doc: 'Annual Report (10-K)' }
      if (cat === 'European-listed') return { src: 'ir', doc: 'Universal Registration Document' }
      if (cat === 'Private / Mutual') return { src: 'fundcentre', doc: 'Fund Annual Report' }
      if (cat === 'German KVG') return { src: 'ir', doc: 'Geschäftsbericht / Jahresbericht' }
      return na
    case 'interim':
      if (cat === 'US-listed') return { src: 'edgar', doc: 'Quarterly results (10-Q / 8-K)' }
      if (cat === 'European-listed') return { src: 'ir', doc: 'Half-Year Report' }
      return na
    case 'deck':
      return LISTED.has(cat) ? { src: 'ir', doc: 'Earnings Presentation' } : na
    case 'adv':
      return US.has(cat) ? { src: 'iapd', doc: 'Form ADV (Part 1 + 2A)' } : na
    case 'banz':
      return cat === 'German KVG' ? { src: 'banz', doc: 'Bundesanzeiger filing' } : na
    case 'prospectus':
      return cat === 'German KVG'
        ? { src: 'fundcentre', doc: 'KID / Wesentliche Anlegerinformationen' }
        : { src: 'fundcentre', doc: 'Fund Prospectus' }
    case 'factsheet':
      return { src: 'fundcentre', doc: 'Fund Factsheet' }
    case 'esg':
      return LISTED.has(cat) || cat === 'German KVG'
        ? { src: 'ir', doc: 'SFDR / Sustainability Report' }
        : { src: 'ir', doc: 'Sustainability Report' }
    case 'press':
      return { src: 'ir', doc: 'Press Release' }
    default:
      return na
  }
}

const CAT_ORDER = ['US-listed', 'European-listed', 'Private / Mutual', 'German KVG']

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

  const { firms, usedSrc } = useMemo(() => {
    const firms = COMPETITORS
      .map((c) => ({ code: c.code, name: c.name, category: c.category, cells: FLAT.map((col) => docCell(c.category, col.key)) }))
      .sort((a, b) => (CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category)) || a.name.localeCompare(b.name))
    const usedSrc = (Object.keys(DSRC) as DocSrc[]).filter((k) => firms.some((f) => f.cells.some((c) => c.src === k)))
    return { firms, usedSrc }
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
        sub={`Which documents each of ${firms.length} competitors should disclose, and where + how we fetch each — by disclosure regime. SEC EDGAR / IAPD for US filers, IR sites for listed-firm reports, fund document centres for prospectuses & factsheets, Bundesanzeiger for German statutory filings. "n/a" = not part of that regime. Live scraper status is below.`}
      />
      <div className="view">
        <Panel title={<>Document sources <span className="muted2">{usedSrc.length} source families · where + how each document is fetched</span></>}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5 }}>
            {usedSrc.map((k) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }} title={DSRC[k].method}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: DSRC[k].color, display: 'inline-block' }} />
                <span style={{ color: 'var(--ink-1)' }}>{DSRC[k].label}</span>
                <span className="muted2">{DSRC[k].method}</span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={<>Source & methodology matrix <span className="muted2">competitor × document type · where + how to fetch each</span></>} bodyStyle={{ padding: 0 }}>
          <div className="tbl-wrap">
            <table className="tbl" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 2, textAlign: 'left', verticalAlign: 'bottom' }}>Competitor</th>
                  {GROUPS.map((g) => (
                    <th key={g.group} colSpan={g.cols.length} style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-3)', borderLeft: '1px solid var(--line)', whiteSpace: 'nowrap', padding: '4px 6px' }}>{g.group}</th>
                  ))}
                </tr>
                <tr>
                  {GROUPS.map((g) => g.cols.map((c, j) => (
                    <th key={c.key} className="num" style={{ textAlign: 'center', whiteSpace: 'nowrap', fontSize: 11, borderLeft: j === 0 ? '1px solid var(--line)' : undefined }}>{c.label}</th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {firms.map((f) => {
                  let gi = 0
                  return (
                    <tr key={f.code}>
                      <td style={{ position: 'sticky', left: 0, background: 'var(--surface-1)', zIndex: 1, fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {f.name}
                        <span className="muted2" style={{ marginLeft: 6, fontSize: 11 }}>{f.category}</span>
                      </td>
                      {GROUPS.map((g) => g.cols.map((c, j) => {
                        const cell = f.cells[gi++]
                        const meta = DSRC[cell.src]
                        const na = cell.src === 'na'
                        return (
                          <td key={c.key} style={{ textAlign: 'center', padding: '4px 5px', borderLeft: j === 0 ? '1px solid var(--line)' : undefined }}>
                            <span
                              title={`${f.name} · ${c.label}: ${cell.doc}${na ? '' : ` → ${meta.label} · ${meta.method}`}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                minWidth: 26, height: 22, padding: '0 7px', borderRadius: 5,
                                background: meta.color, color: '#fff', fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap',
                                opacity: na ? 0.42 : 1,
                              }}
                            >
                              {meta.label}
                            </span>
                          </td>
                        )
                      }))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {offline ? (
          <Panel title="Live fetcher status">
            <div className="room-empty">
              Fetch server offline — run <code>python3 -m competitor_ingest.server</code> in <code>spike/</code> to see live scraper status.
            </div>
          </Panel>
        ) : (
          <Panel
            title={
              <>
                Live fetcher status{' '}
                <span className="muted2">
                  {rows ? `${rows.length} scrapers · ${green} healthy · ${total} documents fetched` : 'loading…'}
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
              The matrix above is the source plan by disclosure regime; this table is the live state of each dedicated scraper.
              <b> Tests</b> is green when the fetcher's archive holds documents; pending = registered but not yet crawled.
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
              No dedicated fetcher: <b>Inherited</b> = documents come from a parent already fetched (PIMCO via Allianz, Deka
              Immobilien via DekaBank); <b>Overlay-only</b> = tracked on financial numbers, parent rollup not crawled;
              <b> No source</b> = no public document source (Universal Investment’s accounts are Bundesanzeiger-only, captcha-gated).
            </div>
          </Panel>
        ) : null}
      </div>
    </>
  )
}
