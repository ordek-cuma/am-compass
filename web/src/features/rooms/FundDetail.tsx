// Product detail page — real product profile (header · stat cards · classification · vitals · source).
import type { ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../../components/icons'
import { StatCard } from '../../components/facts'
import { Panel } from '../../components/Panel'
import { productByIsin } from '../../data/products'
import { fdate, fpct } from '../../lib/format'

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="meta-row">
      <span className="k">{k}</span>
      <span className="v">{v || '—'}</span>
    </div>
  )
}

export function FundDetail() {
  const { fundId } = useParams()
  const navigate = useNavigate()
  const p = productByIsin(fundId)
  if (!p) return <Navigate to="/rooms/product" replace />

  const chips = [p.brand, p.vehicle, p.assetClass, p.region, p.listing, p.sfdr].filter(Boolean)
  const aum = p.aum != null ? (p.aum >= 1000 ? `$${(p.aum / 1000).toFixed(2)}B` : `$${p.aum.toFixed(1)}M`) : '—'

  return (
    <div className="view">
      <button className="backbtn" onClick={() => navigate('/rooms/product')}>
        <BackIcon />
        Product Data Room
      </button>

      <div className="pd-head">
        <span className="pd-tick">{p.ticker || p.isin.slice(0, 6)}</span>
        <div className="pd-name">{p.name}</div>
        <div className="pd-meta">
          <span className="chip teal">{p.manager}</span>
          {chips.map((c) => (
            <span key={c} className="ac-chip">
              {c}
            </span>
          ))}
          <span className="pd-isin">
            {p.ticker && p.ticker !== p.isin ? `${p.isin} · ${p.ticker}` : p.isin}
          </span>
        </div>
      </div>

      <div className="pd-stats">
        <StatCard label="AUM" value={aum} />
        <StatCard label="TER (expense ratio)" value={p.ter != null ? p.ter.toFixed(2) + '%' : '—'} />
        <StatCard label="1Y p.a." value={p.perf1y != null ? fpct(p.perf1y) : '—'} cls={p.perf1y != null && p.perf1y < 0 ? 'neg' : 'pos'} />
        <StatCard label="3Y p.a." value={p.perf3y != null ? fpct(p.perf3y) : '—'} cls={p.perf3y != null && p.perf3y < 0 ? 'neg' : 'pos'} />
        <StatCard label="5Y p.a." value={p.perf5y != null ? fpct(p.perf5y) : '—'} cls={p.perf5y != null && p.perf5y < 0 ? 'neg' : 'pos'} />
        <StatCard label="Dist. yield" value={p.yield != null ? p.yield.toFixed(2) + '%' : '—'} />
      </div>

      <div className="cols-2" style={{ alignItems: 'start' }}>
        <Panel title="Classification">
          <Row k="Manager / brand" v={`${p.manager} · ${p.brand}`} />
          <Row k="Vehicle" v={p.vehicle} />
          <Row k="Asset class" v={p.assetClass} />
          <Row k="Sub-asset class" v={p.subAssetClass} />
          <Row k="Exposure region" v={p.region} />
          <Row k="Market type" v={p.marketType} />
          <Row k="Investment style" v={p.style} />
          <Row k="ESG classification" v={p.esg} />
          <Row k="SFDR" v={p.sfdr} />
        </Panel>
        <Panel title="Vitals">
          <Row k="AUM (USD)" v={aum} />
          <Row k="TER / OCF" v={p.ter != null ? p.ter.toFixed(2) + '%' : '—'} />
          <Row k="Base currency" v={p.ccy} />
          <Row k="Domicile" v={p.domicile} />
          <Row k="Listing" v={p.listing} />
          <Row k="Inception" v={fdate(p.inception)} />
          <Row k="1Y / 3Y / 5Y p.a." v={[p.perf1y, p.perf3y, p.perf5y].map((x) => (x != null ? fpct(x) : '—')).join('  ·  ')} />
          <Row k="Distribution yield" v={p.yield != null ? p.yield.toFixed(2) + '%' : '—'} />
          <Row
            k="Source"
            v={
              p.url ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="lnk">
                  iShares product page ↗
                </a>
              ) : (
                '—'
              )
            }
          />
        </Panel>
      </div>

      <div className="sub-note">
        Real product data from BlackRock iShares' published product-screener feeds (US + EMEA/UCITS); AUM FX-normalised to USD.
      </div>
    </div>
  )
}
