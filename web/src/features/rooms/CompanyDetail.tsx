// Company detail page (spec §8.2): header · stat cards · 2-1 layout (documents / company details).
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../../components/icons'
import { AttachList, PlainRow, StatCard, type Attachment } from '../../components/facts'
import { Panel } from '../../components/Panel'
import { COMPANIES } from '../../data/companies'
import { fdate } from '../../lib/format'

export function CompanyDetail() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const c = COMPANIES.find((x) => x.tick === decodeURIComponent(companyId || ''))
  if (!c) return <Navigate to="/rooms/company" replace />

  const docs = [...c.docs].sort((a, b) => b.date.localeCompare(a.date))
  const last = docs.length ? docs[0].date : ''
  const cats = [...new Set(c.docs.map((d) => d.cat))]
  const attachments: Attachment[] = docs.map((d) => ({
    name: d.doc,
    fmt: d.fmt,
    meta: `${d.cat} · ${fdate(d.date)} · ${d.sz}`,
  }))
  const facts: [string, string | number][] = [
    ['Segment', c.seg],
    ['Country', c.country],
    ['Ticker', c.tick],
    ['Documents', c.docs.length],
    ['Categories', cats.join(', ')],
    ['Last Update', fdate(last)],
    ['Coverage', 'EMEA Equity Desk'],
    ['Relationship', 'Active · Onboarded'],
  ]

  return (
    <div className="view">
      <button className="backbtn" onClick={() => navigate('/rooms/company')}>
        <BackIcon />
        Company Data Room
      </button>

      <div className="pd-head">
        <span className="pd-tick">{c.tick}</span>
        <div className="pd-name">{c.co}</div>
        <div className="pd-meta">
          <span className="chip teal">{c.seg}</span>
          <span className="ac-chip">{c.country}</span>
          <span className="pd-isin">{c.docs.length} documents</span>
        </div>
      </div>

      <div className="pd-stats">
        <StatCard label="Documents" value={c.docs.length} />
        <StatCard label="Segment" value={c.seg} />
        <StatCard label="Country" value={c.country} />
        <StatCard label="Last Updated" value={fdate(last)} />
      </div>

      <div className="cols-21">
        <Panel title={`Documents · ${docs.length}`}>
          <AttachList items={attachments} />
        </Panel>
        <Panel title="Company Details">
          {facts.map(([k, v]) => (
            <PlainRow key={k} label={k} value={v} />
          ))}
        </Panel>
      </div>
    </div>
  )
}
