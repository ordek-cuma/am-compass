// Settings › Data Fetcher › Financial Fetcher — the source playbook for financial data, as a
// matrix (mirrors Product Fetcher): competitor × every financial metric we collect, each box
// showing WHERE that number is fetched from. A solid chip = the source actually recorded in the
// snapshot; a dimmed chip = the planned source-of-record for a number not yet collected, derived
// from the competitor's disclosure regime. The table is wide — it scrolls horizontally.
import { useMemo } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { Panel } from '../../components/Panel'
import { allFinancials } from '../../data/financials'
import { COMPETITORS } from '../../data/competitors'

// ── Columns: every financial metric we collect, grouped left→right by theme ──────────
type Col = { key: string; label: string }
const GROUPS: { group: string; cols: Col[] }[] = [
  { group: 'Scale', cols: [
    { key: 'aum_total', label: 'AuM' }, { key: 'aum_average', label: 'Avg AuM' }, { key: 'aua', label: 'AuA' },
  ] },
  { group: 'Flows', cols: [
    { key: 'net_flows', label: 'Net flows' }, { key: 'organic_growth_rate', label: 'Organic %' },
    { key: 'gross_sales', label: 'Gross sales' }, { key: 'redemptions', label: 'Redemptions' },
  ] },
  { group: 'Revenue & fees', cols: [
    { key: 'total_revenue', label: 'Revenue' }, { key: 'mgmt_fee_revenue', label: 'Mgmt fees' },
    { key: 'performance_fees', label: 'Perf fees' }, { key: 'effective_fee_rate', label: 'Fee rate' },
  ] },
  { group: 'Profitability', cols: [
    { key: 'operating_income', label: 'Op income' }, { key: 'operating_margin', label: 'Op margin' },
    { key: 'net_income', label: 'Net income' }, { key: 'eps_diluted', label: 'EPS' },
  ] },
  { group: 'Workforce', cols: [
    { key: 'headcount', label: 'Headcount' }, { key: 'num_countries', label: 'Countries' },
    { key: 'investment_professionals', label: 'Inv. pros' }, { key: 'num_funds', label: 'Funds' },
  ] },
  { group: 'Capital', cols: [
    { key: 'market_cap', label: 'Mkt cap' }, { key: 'pe_ratio', label: 'P/E' },
    { key: 'dividends_per_share', label: 'DPS' }, { key: 'buybacks', label: 'Buybacks' },
  ] },
  { group: 'Business mix', cols: [
    { key: 'aum_by_asset_class', label: 'AuM mix' }, { key: 'aum_by_region', label: 'Region mix' },
    { key: 'aum_by_channel', label: 'Channel mix' },
  ] },
  { group: 'Strategy', cols: [
    { key: 'pct_passive', label: '% passive' }, { key: 'pct_alternatives', label: '% alts' },
    { key: 'pct_esg', label: '% ESG' },
  ] },
]
const FLAT: Col[] = GROUPS.flatMap((g) => g.cols)

// ── Source families ──────────────────────────────────────────────────────────────────
type Fam = 'xbrl' | 'filing' | 'eu' | 'adv' | 'market' | 'tracker' | 'estimate' | 'derived' | 'na'
const FAM: Record<Fam, { label: string; color: string; tier: string }> = {
  xbrl: { label: 'SEC XBRL', color: '#2f6fb0', tier: 'Regulatory · filed' },
  filing: { label: 'SEC 10-K / 8-K', color: '#3b7cae', tier: 'Regulatory · filed' },
  eu: { label: 'EU reports / URD', color: '#1f9d76', tier: 'Company disclosure' },
  adv: { label: 'Form ADV', color: '#6f9a33', tier: 'Regulatory · filed' },
  market: { label: 'Market data', color: '#7a52b3', tier: 'Third-party' },
  tracker: { label: 'Tracker (Morningstar…)', color: '#c08a23', tier: 'Third-party' },
  estimate: { label: 'Estimate', color: '#c2683b', tier: 'Flagged estimate' },
  derived: { label: 'Derived', color: '#7b8190', tier: 'Computed in-pipeline' },
  na: { label: 'n/a', color: '#566070', tier: 'Not applicable' },
}
// recorded vendor tag → family
const VFAM: Record<string, Fam> = {
  xbrl: 'xbrl', 'table-parse': 'filing', analyst: 'filing', 'analyst-eu': 'eu', 'form-adv': 'adv',
  'market-data': 'market', tracker: 'tracker', estimate: 'estimate', derive: 'derived',
}

const LISTED = new Set(['US-listed', 'European-listed'])
const DERIVED = new Set(['organic_growth_rate', 'effective_fee_rate', 'operating_margin', 'pct_alternatives'])
const EQUITY_MKT = new Set(['market_cap', 'dividends_per_share', 'buybacks']) // listed-only, market-priced

// Where a not-yet-collected number SHOULD come from, from the competitor's disclosure regime.
function expectedSource(category: string, key: string): Fam {
  if (key === 'pe_ratio') return LISTED.has(category) ? 'derived' : 'na'
  if (EQUITY_MKT.has(key)) return LISTED.has(category) ? 'market' : 'na'
  if (key === 'eps_diluted') return LISTED.has(category) ? 'xbrl' : 'na'
  if (DERIVED.has(key)) return 'derived'
  // fundamentals → by disclosure regime
  if (category === 'US-listed') return 'xbrl'
  if (category === 'Private / Mutual') return 'adv'
  if (category === 'European-listed' || category === 'German KVG') return 'eu'
  return 'filing'
}

const CAT: Record<string, string> = Object.fromEntries(COMPETITORS.map((c) => [c.code, c.category]))

export function FinancialFetcher() {
  const { firms, usedFam, collected, planned } = useMemo(() => {
    let collected = 0
    let planned = 0
    const firms = allFinancials().map(({ code, block }) => {
      const category = CAT[code] ?? ''
      const cells = FLAT.map((col) => {
        const m = block.metrics[col.key]
        const has = !!m && (m.value != null || (m.members?.length ?? 0) > 0)
        if (has) collected++
        else planned++
        const fam: Fam = has ? (VFAM[m!.vendor || m!.source] ?? 'tracker') : expectedSource(category, col.key)
        return { fam, has }
      })
      const n = cells.filter((c) => c.has).length
      return { code, name: block.name || code, category, n, cells }
    }).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))
    const usedFam = (Object.keys(FAM) as Fam[]).filter((k) => firms.some((f) => f.cells.some((c) => c.fam === k)))
    return { firms, usedFam, collected, planned }
  }, [])

  return (
    <>
      <ModuleHeader
        crumb={<>Compass <b>›</b> Settings <b>›</b> Data Fetcher <b>›</b> Financial Fetcher</>}
        title={<>Financial <span className="em">Fetcher</span></>}
        sub={`Where every financial number is fetched from — ${firms.length} competitors × ${FLAT.length} metrics. A solid chip is a source recorded in the snapshot (${collected.toLocaleString()} collected); a dimmed chip is the planned source-of-record for a number still to collect (${planned.toLocaleString()}), set by the competitor's disclosure regime. The grid is wide — scroll it sideways.`}
      />
      <div className="view">
        <Panel title={<>Data sources <span className="muted2">{usedFam.length} source families · solid = collected · dimmed = planned</span></>}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5 }}>
            {usedFam.map((k) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, background: FAM[k].color, display: 'inline-block' }} />
                <span style={{ color: 'var(--ink-1)' }}>{FAM[k].label}</span>
                <span className="muted2">{FAM[k].tier}</span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel title={<>Source matrix <span className="muted2">competitor × financial metric · where to fetch each number</span></>} bodyStyle={{ padding: 0 }}>
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
                        <span className="muted2" style={{ marginLeft: 6, fontSize: 11 }}>{f.code}</span>
                      </td>
                      {GROUPS.map((g) => g.cols.map((c, j) => {
                        const cell = f.cells[gi++]
                        const meta = FAM[cell.fam]
                        return (
                          <td key={c.key} style={{ textAlign: 'center', padding: '4px 5px', borderLeft: j === 0 ? '1px solid var(--line)' : undefined }}>
                            <span
                              title={`${f.name} · ${c.label} → ${meta.label} (${meta.tier})${cell.has ? ' · collected' : ' · planned (not yet collected)'}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                minWidth: 26, height: 22, padding: '0 7px', borderRadius: 5,
                                background: meta.color, color: '#fff', fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap',
                                opacity: cell.has ? 1 : 0.42,
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
      </div>
    </>
  )
}
