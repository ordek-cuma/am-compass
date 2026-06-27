// Settings › Data Fetcher › Financial Fetcher — the provenance ledger for every financial
// metric in the cockpit. Reads the committed snapshot (competitor_financials.json) and shows,
// vendor-by-vendor and metric-by-metric, exactly where each number comes from and how trusted
// it is. The companion methodology lives in spike/competitor_ingest/METHODOLOGY.md.
import { useMemo } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { allFinancials } from '../../data/financials'
import { METRICS_BY_TAB, OVERVIEW_TILES } from '../../data/metricCatalog'

// Vendor (provenance) catalog — keyed by the `vendor` tag the agent stamps on every observation.
type VendorMeta = { name: string; type: string; tier: 1 | 2 | 3 | 4; url?: string; desc: string }
const VENDORS: Record<string, VendorMeta> = {
  xbrl: { name: 'SEC EDGAR — XBRL company facts', type: 'Regulatory filing', tier: 1,
    url: 'https://www.sec.gov/edgar', desc: 'Machine-readable GAAP financials from each US filer’s 10-K/20-F XBRL (revenue, income, EPS, dividends, buybacks). Multi-year, period-aligned.' },
  'table-parse': { name: 'SEC 10-K — MD&A table parser', type: 'Regulatory filing', tier: 1,
    url: 'https://www.sec.gov/edgar', desc: 'Figures parsed from 10-K management-discussion tables (AuM breakdowns, fee lines), each reconciled to the firm’s known total before it’s recorded.' },
  analyst: { name: 'SEC 10-K / 8-K — hand-verified', type: 'Regulatory filing', tier: 1,
    url: 'https://www.sec.gov/edgar', desc: 'Headline figures read verbatim from US filings/earnings releases into a cited overlay (AuM, flows, headcount, market cap, dividends).' },
  'analyst-eu': { name: 'Annual reports & results — Europe', type: 'Company disclosure', tier: 1,
    desc: 'Cited figures from European annual reports, Universal Registration Documents and FY results releases. Native currency → USD at a stated period-end FX rate.' },
  'form-adv': { name: 'SEC Form ADV (IAPD)', type: 'Regulatory filing', tier: 1,
    url: 'https://adviserinfo.sec.gov', desc: 'Item 5 regulatory AUM, adviser-entity staff and account counts. Single-entity scope — a regulatory cross-check, not the brand’s marketed AUM/headcount.' },
  tracker: { name: 'Market data & industry trackers', type: 'Third-party (attributed)', tier: 2,
    desc: 'Market data and fund-flow trackers where the company discloses nothing firm-level (e.g. market cap from stockanalysis.com, fund flows from Morningstar). Attributed, dated.' },
  estimate: { name: 'Transparent model estimate', type: 'Derived estimate', tier: 3,
    desc: 'A clearly-flagged estimate where no figure is published at all (e.g. Vanguard at-cost revenue). The method is shown on every value; never presented as a reported fact.' },
  derive: { name: 'Derived (computed)', type: 'Computed in-pipeline', tier: 4,
    desc: 'Ratios computed from base metrics in the same period — operating margin, P/E, organic growth, fee yield, AuM/revenue per employee.' },
}
const TIER_LABEL: Record<number, string> = { 1: 'Regulatory / filed', 2: 'Third-party', 3: 'Estimate', 4: 'Computed' }
const TIER_CLASS: Record<number, FieldTier> = { 1: 'have', 2: 'partial', 3: 'partial', 4: 'add' }
type FieldTier = 'have' | 'partial' | 'add'

// metric key → human label, flattened from the catalog.
const LABELS: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const defs of Object.values(METRICS_BY_TAB)) for (const d of defs) m[d.key] = d.label
  for (const d of OVERVIEW_TILES) m[d.key] = m[d.key] ?? d.label
  return m
})()
const label = (k: string) => LABELS[k] ?? k

export function FinancialFetcher() {
  const { vendorRows, metricRows, totals } = useMemo(() => {
    const firms = allFinancials()
    // vendor → aggregates
    const vAgg: Record<string, { metrics: Set<string>; firms: Set<string>; points: number }> = {}
    // metric → vendor → count
    const mAgg: Record<string, Record<string, number>> = {}
    let points = 0
    for (const { code, block } of firms) {
      for (const [key, met] of Object.entries(block.metrics)) {
        const v = met.vendor || met.source || 'unknown'
        if (!VENDORS[v] && v !== 'unknown') continue
        vAgg[v] ??= { metrics: new Set(), firms: new Set(), points: 0 }
        vAgg[v].metrics.add(key)
        vAgg[v].firms.add(code)
        vAgg[v].points++
        mAgg[key] ??= {}
        mAgg[key][v] = (mAgg[key][v] || 0) + 1
        points++
      }
    }
    const order = ['xbrl', 'table-parse', 'analyst', 'analyst-eu', 'form-adv', 'tracker', 'estimate', 'derive']
    const vendorRows = order
      .filter((v) => vAgg[v])
      .map((v) => ({ key: v, meta: VENDORS[v], ...vAgg[v] }))
    const metricRows = Object.entries(mAgg)
      .map(([key, vendors]) => ({
        key,
        vendors: Object.entries(vendors).sort((a, b) => b[1] - a[1]),
        firms: Object.values(vendors).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.firms - a.firms)
    return {
      vendorRows,
      metricRows,
      totals: { firms: firms.length, points, sources: vendorRows.length, metrics: metricRows.length },
    }
  }, [])

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Settings <b>›</b> Data Fetcher <b>›</b> Financial Fetcher</>}
        title={<>Financial <span className="em">Fetcher</span></>}
        sub={`Provenance ledger for every financial metric — vendor by vendor, metric by metric. ${totals.sources} sources feed ${totals.points.toLocaleString()} data points across ${totals.firms} competitors and ${totals.metrics} metrics. Each value is graded by trust: regulatory filings → third-party trackers → flagged estimates → computed ratios.`}
      />
      <div className="view">
        <Panel title={<>Data sources <span className="muted2">{totals.sources} vendors · ranked by trust</span></>}>
          <div style={{ display: 'grid', gap: 12 }}>
            {vendorRows.map((r) => (
              <div key={r.key} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`sdot ${TIER_CLASS[r.meta.tier]}`} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{r.meta.name}</span>
                  <span className="tk-tick" style={{ textTransform: 'none' }}>{r.meta.type}</span>
                  <span className="muted2" style={{ marginLeft: 'auto', fontSize: 12 }}>
                    Tier {r.meta.tier} · {TIER_LABEL[r.meta.tier]}
                  </span>
                </div>
                <div style={{ color: 'var(--ink-2)', fontSize: 12.5, margin: '6px 0 8px', lineHeight: 1.5 }}>{r.meta.desc}</div>
                <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--ink-3)' }}>
                  <span><b style={{ color: 'var(--ink-1)' }}>{r.metrics.size}</b> metrics</span>
                  <span><b style={{ color: 'var(--ink-1)' }}>{r.firms.size}</b> firms</span>
                  <span><b style={{ color: 'var(--ink-1)' }}>{r.points}</b> data points</span>
                  {r.meta.url ? <a href={r.meta.url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto' }}>source ↗</a> : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={<>Metric → source <span className="muted2">data by data · where each number comes from</span></>} bodyStyle={{ padding: 0 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Source(s) — primary first</th>
                  <th className="num">Firms</th>
                </tr>
              </thead>
              <tbody>
                {metricRows.map((r) => (
                  <tr key={r.key}>
                    <td style={{ fontWeight: 500 }}>{label(r.key)}<div className="tk-tick" style={{ textTransform: 'none' }}>{r.key}</div></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {r.vendors.map(([v, n]) => (
                          <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-2)' }}>
                            <span className={`sdot ${TIER_CLASS[VENDORS[v]?.tier ?? 4]}`} />
                            {VENDORS[v]?.name ?? v}<span className="muted2">×{n}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="num">{r.firms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  )
}
