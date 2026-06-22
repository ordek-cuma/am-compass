// Company detail page (spec §8.2): header · stat cards · 2-1 layout (documents / company details).
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../../components/icons'
import { AttachList, PlainRow, StatCard, type Attachment } from '../../components/facts'
import { Empty, Panel } from '../../components/Panel'
import { COMPANIES } from '../../data/companies'
import { documentsFor, financialsFor, fmtBytes } from '../../data/financials'
import { fdate } from '../../lib/format'
import { FinancialsPanel } from './FinancialsPanel'

export function CompanyDetail() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const c = COMPANIES.find((x) => x.tick === decodeURIComponent(companyId || ''))
  if (!c) return <Navigate to="/rooms/competitor" replace />

  const [tab, setTab] = useState<'docs' | 'financials'>('docs')
  const hasFinancials = !!financialsFor(c.tick)
  // ONLY real documents — crawled local files or primary-source links. No placeholders.
  const realDocs = [...documentsFor(c.tick)].sort((a, b) => b.date.localeCompare(a.date))
  const last = realDocs.length ? realDocs[0].date : ''
  const attachments: Attachment[] = realDocs.map((d) => ({
    name: d.name,
    fmt: d.fmt,
    meta: d.file
      ? `${d.form} · ${fdate(d.date)} · ${fmtBytes(d.sizeBytes)} · crawled (SEC EDGAR)`
      : `${d.form} · ${fdate(d.date)} · primary source`,
    file: d.file || undefined,
    edgarUrl: d.edgarUrl || undefined,
  }))
  const facts: [string, import('react').ReactNode][] = [
    ['Focus', c.seg],
    ['Region', c.region ?? '—'],
    ['HQ / Country', c.country],
    ['Owner', c.owner ?? '—'],
    ['Disclosure', c.regime ?? '—'],
    ['Code', c.tick],
    ['Website', c.website ? (
      <a href={`https://${c.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--teal-ink)', fontWeight: 500 }}>
        {c.website}
      </a>
    ) : '—'],
    ['Documents', realDocs.length],
    ['Last Update', realDocs.length ? fdate(last) : '—'],
  ]

  return (
    <div className="view">
      <button className="backbtn" onClick={() => navigate('/rooms/competitor')}>
        <BackIcon />
        Competitor Data Room
      </button>

      <div className="pd-head">
        <span className="pd-tick">{c.tick}</span>
        <div className="pd-name">{c.co}</div>
        <div className="pd-meta">
          <span className="chip teal">{c.seg}</span>
          {c.region ? <span className="ac-chip">{c.region}</span> : null}
          {c.regime ? <span className="ac-chip">{c.regime}</span> : null}
          <span className="ac-chip">{c.country}</span>
          <span className="pd-isin">{realDocs.length} documents</span>
        </div>
      </div>

      <div className="pd-stats">
        <StatCard label="Documents" value={realDocs.length} />
        <StatCard label="Focus" value={c.seg} />
        <StatCard label="Region" value={c.region ?? '—'} />
        <StatCard label="Last Updated" value={realDocs.length ? fdate(last) : '—'} />
      </div>

      <div className="mtabs ftabs">
        <button className={`mtab${tab === 'docs' ? ' on' : ''}`} onClick={() => setTab('docs')}>
          Documents
        </button>
        <button className={`mtab${tab === 'financials' ? ' on' : ''}`} onClick={() => setTab('financials')}>
          Financials{hasFinancials ? <span className="ct">SEC</span> : null}
        </button>
      </div>

      {tab === 'docs' ? (
        <div className="cols-21">
          <Panel title={`Documents · ${attachments.length}`}>
            {attachments.length ? (
              <AttachList items={attachments} />
            ) : (
              <Empty title="No documents yet" desc="This competitor’s filings haven’t been crawled yet (e.g. acquired or pending a harvester)." icon="docs" />
            )}
          </Panel>
          <Panel title="Competitor Details">
            {facts.map(([k, v]) => (
              <PlainRow key={k} label={k} value={v} />
            ))}
          </Panel>
        </div>
      ) : (
        <FinancialsPanel code={c.tick} />
      )}
    </div>
  )
}
