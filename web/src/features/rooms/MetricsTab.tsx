// One competitor-intelligence category (Scale, Flows, Revenue & Fees, …) for a competitor.
// Scalars render with a status dot + value + up-to-3y trend + source tooltip; breakdown
// ("by-X") metrics render their members with share-of-total. "Not disclosed" where pending.
import { Empty, Panel } from '../../components/Panel'
import { financialsFor, fmtMetric, fmtValue, statusOf, type FinMetric } from '../../data/financials'
import { CATEGORY_LABEL, METRICS_BY_CATEGORY, type Category } from '../../data/metricCatalog'

export function MetricsTab({ code, category }: { code: string; category: Category }) {
  const fin = financialsFor(code)
  const defs = METRICS_BY_CATEGORY[category]
  if (!fin) {
    return (
      <Panel title={CATEGORY_LABEL[category]}>
        <Empty title="No financials ingested yet" desc="This competitor’s numbers haven’t been extracted yet." icon="catalog" />
      </Panel>
    )
  }
  const scalars = defs.filter((d) => !d.cut)
  const cuts = defs.filter((d) => d.cut)

  return (
    <div className="cols-2" style={{ alignItems: 'start' }}>
      <Panel title={<>{CATEGORY_LABEL[category]} <span className="muted2">firm-level</span></>}>
        {scalars.map((d) => {
          const m = fin.metrics[d.key] as FinMetric | undefined
          const pending = !m || m.value === null || m.value === undefined
          const hist = (m?.history ?? []).filter((h) => h.value != null)
          return (
            <div className="meta-row" key={d.key}>
              <span className="k">
                <span className={`sdot ${statusOf(m)}`} />
                {d.label}
                {d.derived ? <span className="ct">calc</span> : null}
                {d.nonGaap ? <span className="ct">adj</span> : null}
              </span>
              <span className={`v ${pending ? 'ph' : ''}`} title={m ? `${m.basis} · conf ${m.confidence} · ${m.section}` : 'not disclosed'}>
                {pending ? 'Not disclosed' : fmtMetric(m as FinMetric)}
                {hist.length > 1 ? (
                  <span className="muted2" style={{ marginLeft: 8, fontWeight: 400 }}>
                    {hist.slice(1, 4).map((h) => `${h.period_end.slice(0, 4)} ${fmtValue(h.value, (m as FinMetric).unit)}`).join(' · ')}
                  </span>
                ) : null}
              </span>
            </div>
          )
        })}
      </Panel>

      {cuts.length ? (
        <div style={{ display: 'grid', gap: 'var(--gap, 16px)' }}>
          {cuts.map((d) => {
            const m = fin.metrics[d.key] as FinMetric | undefined
            const members = (m?.members ?? []).filter((x) => x.value != null)
            const total = members.reduce((a, x) => a + (x.value || 0), 0)
            return (
              <Panel
                key={d.key}
                title={<>{d.label} {m?.period_end ? <span className="muted2">FY {m.period_end.slice(0, 4)}</span> : null}</>}
              >
                {members.length ? (
                  members.map((x) => (
                    <div className="meta-row" key={x.member}>
                      <span className="k">{x.member}</span>
                      <span className="v">
                        {fmtValue(x.value, d.unit)}
                        {total ? <span className="muted2" style={{ marginLeft: 8, fontWeight: 400 }}>{Math.round((100 * (x.value || 0)) / total)}%</span> : null}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="ph" style={{ padding: '4px 2px' }}>Not disclosed</div>
                )}
              </Panel>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
