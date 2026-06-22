// Fund detail page (spec §7.2): header · availability legend · stat cards · six tab sections.
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../../components/icons'
import { StatCard } from '../../components/facts'
import { FUNDS } from '../../data/funds'
import { fnum, fpct } from '../../lib/format'
import { ClassesPanel, DocsPanel, HoldingsPanel, ListingsPanel, MeasuresPanel, OverviewPanel } from './FundPanels'

type Tab = 'overview' | 'classes' | 'listings' | 'holdings' | 'measures' | 'docs'

export function FundDetail() {
  const { fundId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const f = FUNDS.find((x) => x.fundId === fundId)
  if (!f) return <Navigate to="/rooms/product" replace />

  const primary = f.classes[0]
  const nav = (80 + (f.size % 40)).toFixed(2)
  const tabs: [Tab, string][] = [
    ['overview', 'Overview'],
    ['classes', 'Share Classes · ' + f.classes.length],
    ['listings', 'Listings · ' + f.listings.length],
    ['holdings', 'Holdings'],
    ['measures', 'Measures & Fees'],
    ['docs', 'Documents'],
  ]

  return (
    <div className="view">
      <button className="backbtn" onClick={() => navigate('/rooms/product')}>
        <BackIcon />
        Product Data Room
      </button>

      <div className="pd-head">
        <span className="pd-tick">{f.t}</span>
        <div className="pd-name">{f.n}</div>
        <div className="pd-meta">
          <span className="chip teal">{f.pv}</span>
          <span className="ac-chip">{f.structure}</span>
          <span className="ac-chip">{f.strategy}</span>
          <span className="ac-chip">{f.ac}</span>
          <span className="ac-chip">{f.rg}</span>
          <span className="ac-chip">{f.sfdr}</span>
          <span className="pd-isin">
            Fund ID {f.fundId} · {primary.isin}
          </span>
        </div>
      </div>

      <div className="legend">
        <span>
          <span className="sdot have" />
          In archive
        </span>
        <span>
          <span className="sdot partial" />
          Partial / derivable
        </span>
        <span>
          <span className="sdot add" />
          To add
        </span>
      </div>

      <div className="pd-stats">
        <StatCard label="Fund Size (M USD)" value={fnum(f.size)} />
        <StatCard label="TER · OCF" value={f.cost.toFixed(2) + '%'} />
        <StatCard label="1Y p.a." value={fpct(f.y1)} cls={f.y1 >= 0 ? 'pos' : 'neg'} />
        <StatCard label="NAV" value={nav + ' ' + f.ccy} />
        <StatCard label="Share Classes" value={f.classes.length} />
        <StatCard label="Structure" value={f.structure} />
      </div>

      <div className="mtabs ftabs">
        {tabs.map(([t, label]) => (
          <button key={t} className={`mtab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'overview' && <OverviewPanel f={f} />}
        {tab === 'classes' && <ClassesPanel f={f} />}
        {tab === 'listings' && <ListingsPanel f={f} />}
        {tab === 'holdings' && <HoldingsPanel f={f} />}
        {tab === 'measures' && <MeasuresPanel f={f} />}
        {tab === 'docs' && <DocsPanel />}
      </div>
    </div>
  )
}
