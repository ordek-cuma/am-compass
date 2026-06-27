// Competitor-intelligence dashboards. Each tab = KPI tiles + detail (tables for Profitability
// and Revenue, breakdown bars for the cuts, a cockpit for Overview). Values carry a status dot
// + source tooltip; "Not disclosed" where pending. Organization comes from metricCatalog.ts.
import { Empty, Panel } from '../../components/Panel'
import { financialsFor, fmtMetric, fmtValue, statusOf, type FinBlock, type FinMetric } from '../../data/financials'
import {
  METRICS_BY_TAB, OVERVIEW_TILES, REVENUE_LINES, TAB_LABEL, type MetricDef, type Tab,
} from '../../data/metricCatalog'

function yoy(m?: FinMetric): { txt: string; pos: boolean } | null {
  const h = (m?.history ?? []).filter((p) => p.value != null)
  if (h.length < 2 || !h[1].value) return null
  const d = ((h[0].value! - h[1].value!) / Math.abs(h[1].value!)) * 100
  if (!isFinite(d)) return null
  return { txt: `${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(0)}% YoY`, pos: d >= 0 }
}

function Tile({ fin, def }: { fin: FinBlock; def: MetricDef }) {
  const m = fin.metrics[def.key] as FinMetric | undefined
  const pending = !m || m.value === null || m.value === undefined
  const d = pending ? null : yoy(m)
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '11px 13px' }}
      title={m ? `${m.basis} · conf ${m.confidence} · ${m.section}` : 'not disclosed'}>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span className={`sdot ${statusOf(m)}`} />{def.label}
      </div>
      <div style={{ fontSize: 21, fontWeight: 600, marginTop: 3 }}>
        {pending ? <span style={{ color: 'var(--ink-3)', fontSize: 15, fontWeight: 500 }}>Not disclosed</span> : fmtMetric(m as FinMetric)}
      </div>
      <div style={{ fontSize: 11.5, marginTop: 2, color: d ? (d.pos ? 'var(--pos)' : 'var(--neg)') : 'var(--ink-3)' }}>
        {d ? d.txt : def.derived ? 'derived' : m?.basis === 'reported' ? 'reported' : m ? 'filed' : ''}
      </div>
    </div>
  )
}

function Tiles({ fin, defs }: { fin: FinBlock; defs: MetricDef[] }) {
  if (!defs.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: '1.1rem' }}>
      {defs.map((d) => <Tile key={d.key} fin={fin} def={d} />)}
    </div>
  )
}

function ScalarRow({ fin, def }: { fin: FinBlock; def: MetricDef }) {
  const m = fin.metrics[def.key] as FinMetric | undefined
  const pending = !m || m.value === null || m.value === undefined
  const hist = (m?.history ?? []).filter((h) => h.value != null)
  return (
    <div className="meta-row">
      <span className="k">
        <span className={`sdot ${statusOf(m)}`} />{def.label}
        {def.derived ? <span className="ct">calc</span> : null}{def.nonGaap ? <span className="ct">adj</span> : null}
      </span>
      <span className={`v ${pending ? 'ph' : ''}`} title={m ? `${m.basis} · conf ${m.confidence} · ${m.section}` : 'not disclosed'}>
        {pending ? 'Not disclosed' : fmtMetric(m as FinMetric)}
        {hist.length > 1 ? (
          <span className="muted2" style={{ marginLeft: 8, fontWeight: 400 }}>
            {hist.slice(1, 4).map((h) => `${h.period_end.slice(0, 4)} ${fmtValue(h.value, def.unit)}`).join(' · ')}
          </span>
        ) : null}
      </span>
    </div>
  )
}

const TEAL = ['var(--teal)', '#5DCAA5', '#9FE1CB', 'var(--blue)', '#85B7EB', 'var(--gold)']

function shareBars(items: { label: string; value: number }[]) {
  const total = items.reduce((a, x) => a + (x.value || 0), 0)
  return (
    <>
      {items.map((x, i) => {
        const pct = total ? Math.round((100 * x.value) / total) : 0
        return (
          <div key={x.label} style={{ marginBottom: 9 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
              <span>{x.label}</span><span className="muted2">{fmtValue(x.value, 'USD')} · {pct}%</span>
            </div>
            <div style={{ height: 7, background: 'var(--surface-2)', borderRadius: 4 }}>
              <div style={{ height: 7, width: `${pct}%`, background: TEAL[i % TEAL.length], borderRadius: 4 }} />
            </div>
          </div>
        )
      })}
    </>
  )
}

function Breakdown({ fin, def }: { fin: FinBlock; def: MetricDef }) {
  const m = fin.metrics[def.key] as FinMetric | undefined
  const members = (m?.members ?? []).filter((x) => x.value != null) as { member: string; value: number }[]
  return (
    <Panel title={<>{def.label} {m?.period_end ? <span className="muted2">FY {m.period_end.slice(0, 4)}</span> : null}</>}>
      {members.length ? shareBars(members.map((x) => ({ label: x.member, value: x.value }))) : <div className="ph" style={{ padding: '4px 2px' }}>Not disclosed</div>}
    </Panel>
  )
}

function YearTable({ fin, rows, title, grain }: { fin: FinBlock; rows: [string, string, string][]; title: string; grain?: string }) {
  const years = new Set<string>()
  for (const [k] of rows) for (const p of (fin.metrics[k] as FinMetric | undefined)?.history ?? []) if (p.value != null) years.add(p.period_end)
  const cols = [...years].sort().reverse().slice(0, 4)
  if (!cols.length) return <Panel title={title}><div className="room-empty">Not disclosed yet.</div></Panel>
  const cell = (k: string, unit: string, y: string) => {
    const h = ((fin.metrics[k] as FinMetric | undefined)?.history ?? []).find((p) => p.period_end === y)
    return h && h.value != null ? fmtValue(h.value, unit) : '—'
  }
  return (
    <Panel title={<>{title} <span className="muted2">{grain ?? `${cols.length}-year`}</span></>} bodyStyle={{ padding: 0 }}>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Line</th>{cols.map((y) => <th key={y} className="num">FY {y.slice(0, 4)}</th>)}</tr></thead>
          <tbody>
            {rows.map(([k, label, unit]) => {
              const m = fin.metrics[k] as FinMetric | undefined
              const emph = k === 'operating_income' || k === 'net_income' || k === 'total_revenue'
              return (
                <tr key={k}>
                  <td style={{ fontWeight: emph ? 500 : 400 }} title={m ? `${m.basis} · ${m.section}` : 'not disclosed'}>
                    <span className={`sdot ${statusOf(m)}`} />{label}
                  </td>
                  {cols.map((y) => <td key={y} className="num" style={{ fontWeight: emph ? 500 : 400 }}>{cell(k, unit, y)}</td>)}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

const PNL_ROWS: [string, string, string][] = [
  ['total_revenue', 'Total revenue', 'USD'], ['comp_expense', 'Compensation & benefits', 'USD'],
  ['ga_expense', 'General & administrative', 'USD'], ['total_opex', 'Total operating expenses', 'USD'],
  ['operating_income', 'Operating income', 'USD'], ['operating_margin', 'Operating margin (GAAP)', 'pct'],
  ['adj_operating_margin', 'Operating margin (adjusted)', 'pct'], ['net_income', 'Net income', 'USD'],
  ['eps_diluted', 'Diluted EPS', 'USD/shares'],
]
const REV_ROWS: [string, string, string][] = [
  ['mgmt_fee_revenue', 'Investment management / advisory (base) fees', 'USD'],
  ['performance_fees', 'Performance fees', 'USD'],
  ['tech_revenue', 'Technology services (Aladdin / eFront)', 'USD'],
  ['dist_fee_revenue', 'Distribution & servicing fees', 'USD'],
  ['advisory_other_revenue', 'Advisory & other', 'USD'],
  ['total_revenue', 'Total revenue', 'USD'],
  ['effective_fee_rate', 'Effective fee rate (bps)', 'bps'],
  ['performance_fees_pct', 'Performance fees % of revenue', 'pct'],
]

export function MetricsTab({ code, tab }: { code: string; tab: Tab }) {
  const fin = financialsFor(code)
  if (!fin) {
    return <Panel title={TAB_LABEL[tab]}><Empty title="No financials ingested yet" desc="This competitor’s numbers haven’t been extracted yet." icon="catalog" /></Panel>
  }

  if (tab === 'Overview') {
    return (
      <>
        <Tiles fin={fin} defs={OVERVIEW_TILES} />
        <div className="sub-note">Headline KPIs across categories. Open a category tab for the full set, history and breakdowns. Hover a tile for its source.</div>
      </>
    )
  }
  if (tab === 'Profitability') {
    return (<><Tiles fin={fin} defs={METRICS_BY_TAB.Profitability ?? []} /><YearTable fin={fin} rows={PNL_ROWS} title="Income statement" /></>)
  }
  if (tab === 'Revenue') {
    return (<><Tiles fin={fin} defs={METRICS_BY_TAB.Revenue ?? []} /><YearTable fin={fin} rows={REV_ROWS} title="Revenue by line" /></>)
  }
  if (tab === 'BizmixRev') {
    const items = REVENUE_LINES.filter((d) => d.key !== 'total_revenue')
      .map((d) => ({ label: d.label, value: (fin.metrics[d.key] as FinMetric | undefined)?.value }))
      .filter((x) => x.value != null) as { label: string; value: number }[]
    return (
      <Panel title={<>Revenue by business line {fin.metrics.total_revenue?.period_end ? <span className="muted2">FY {fin.metrics.total_revenue.period_end!.slice(0, 4)}</span> : null}</>}>
        {items.length ? shareBars(items) : <div className="ph" style={{ padding: '4px 2px' }}>Not disclosed</div>}
      </Panel>
    )
  }

  const defs = METRICS_BY_TAB[tab] ?? []
  const tiles = defs.filter((d) => d.tile)
  const cuts = defs.filter((d) => d.cut)
  const scalars = defs.filter((d) => !d.tile && !d.cut)
  return (
    <>
      <Tiles fin={fin} defs={tiles} />
      <div className="cols-2" style={{ alignItems: 'start' }}>
        {scalars.length ? <Panel title={TAB_LABEL[tab]}>{scalars.map((d) => <ScalarRow key={d.key} fin={fin} def={d} />)}</Panel> : null}
        {cuts.map((d) => <Breakdown key={d.key} fin={fin} def={d} />)}
      </div>
    </>
  )
}
