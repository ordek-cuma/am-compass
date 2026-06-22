// Financials tab for a competitor — renders the ingestion agent's MetricObservations,
// grouped, with the status-dot availability model (green = XBRL/reported, amber = derived,
// grey = pending the LLM extractor). Mirrors the fund detail's Measures tab.
import { Empty, Panel } from '../../components/Panel'
import { fdate } from '../../lib/format'
import {
  FINANCIALS_GENERATED,
  FINANCIALS_SOURCE,
  FIN_GROUPS,
  financialsFor,
  fmtMetric,
  statusOf,
} from '../../data/financials'

export function FinancialsPanel({ code }: { code: string }) {
  const fin = financialsFor(code)
  if (!fin) {
    return (
      <Panel title="Financials">
        <Empty
          title="No filings ingested yet"
          desc="The competitor-ingestion agent covers US-listed bellwethers in Phase 1. This player is on the roadmap (European URD / German KVG)."
          icon="catalog"
        />
      </Panel>
    )
  }

  return (
    <>
      <div className="legend">
        <span><span className="sdot have" />Reported / filed</span>
        <span><span className="sdot partial" />Derived</span>
        <span><span className="sdot add" />Pending extraction</span>
        <span className="muted2" style={{ marginLeft: 0 }}>
          {FINANCIALS_SOURCE} · {fin.period_end ? `FY ${fin.period_end}` : '—'} · ingested {fdate(FINANCIALS_GENERATED.slice(0, 10))}
        </span>
      </div>

      <div className="cols-2" style={{ alignItems: 'start' }}>
        {FIN_GROUPS.map((g) => (
          <Panel
            key={g.group}
            title={
              <>
                {g.group} <span className="muted2">{g.grain}</span>
              </>
            }
          >
            {g.items.map((it) => {
              const m = fin.metrics[it.key]
              const status = statusOf(m)
              const pending = !m || m.value === null
              return (
                <div className="meta-row" key={it.key}>
                  <span className="k">
                    <span className={`sdot ${status}`} />
                    {it.label}
                  </span>
                  <span className={`v ${pending ? 'ph' : ''}`} title={m ? `${m.basis} · conf ${m.confidence} · ${m.section}` : 'pending LLM extractor'}>
                    {pending ? 'Pending' : fmtMetric(m)}
                  </span>
                </div>
              )
            })}
          </Panel>
        ))}
      </div>
      <div className="sub-note">
        GAAP financials are extracted deterministically from SEC XBRL (confidence 1.0, fully cited). AuM / flows / fee
        revenue come from the 10-K via the LLM extractor — set <code>ANTHROPIC_API_KEY</code> and re-run the agent to fill
        the “Pending” rows and unlock effective fee rate. Hover a value for its basis + source.
      </div>
    </>
  )
}
