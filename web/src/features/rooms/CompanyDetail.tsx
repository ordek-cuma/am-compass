// Company detail page (spec §8.2): header · stat cards · 2-1 layout (documents / company details).
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../../components/icons'
import { AttachList, PlainRow, StatCard, type Attachment } from '../../components/facts'
import { Empty, Panel } from '../../components/Panel'
import { COMPANIES } from '../../data/companies'
import { documentsFor, documentsGroupedFor, fmtBytes, type FinDoc } from '../../data/financials'
import { fdate } from '../../lib/format'
import { ScrapeControls } from './ScrapeControls'
import { MetricsTab } from './MetricsTab'
import { TOP_TABS, TAB_LABEL, type Tab } from '../../data/metricCatalog'

export function CompanyDetail() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const c = COMPANIES.find((x) => x.tick === decodeURIComponent(companyId || ''))
  if (!c) return <Navigate to="/rooms/competitor" replace />

  const [tab, setTab] = useState<'docs' | Tab>('docs')
  // ONLY real documents — crawled local files or primary-source links. No placeholders.
  const realDocs = [...documentsFor(c.tick)].sort((a, b) => b.date.localeCompare(a.date))
  const last = realDocs.length ? realDocs[0].date : ''
  const toAttachment = (d: FinDoc): Attachment => ({
    name: d.name,
    fmt: d.fmt,
    meta: d.file
      ? `${d.form} · ${fdate(d.date)} · ${fmtBytes(d.sizeBytes)} · crawled (${d.form === 'IR' ? 'IR' : 'SEC EDGAR'})`
      : `${d.form} · ${fdate(d.date)} · primary source`,
    file: d.file || undefined,
    edgarUrl: d.edgarUrl || undefined,
  })
  const groups = documentsGroupedFor(c.tick).map((g) => ({
    group: g.group,
    items: [...g.docs].sort((a, b) => b.date.localeCompare(a.date)).map(toAttachment),
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

      <div className="mtabs ftabs" style={{ overflowX: 'auto' }}>
        <button className={`mtab${tab === 'docs' ? ' on' : ''}`} onClick={() => setTab('docs')}>
          Documents<span className="ct">{realDocs.length}</span>
        </button>
        {TOP_TABS.map((t) => (
          <button key={t} className={`mtab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'docs' ? (
        <>
        <ScrapeControls code={c.tick} />
        <div className="cols-21">
          <Panel title={`Documents · ${realDocs.length}`}>
            {groups.length ? (
              <div className="docgroups">
                {groups.map((g) => (
                  <section key={g.group} className="docgroup">
                    <div className="docgroup-h">
                      <span>{g.group}</span>
                      <span className="docgroup-n">{g.items.length}</span>
                    </div>
                    <AttachList items={g.items} />
                  </section>
                ))}
              </div>
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
        </>
      ) : (
        <MetricsTab code={c.tick} tab={tab} />
      )}
    </div>
  )
}
