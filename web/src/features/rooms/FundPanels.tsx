// Fund detail tab sections (spec §7.2). Status dots + placeholders mirror the archive-coverage
// roadmap; amber "partial" sample values are illustrative.
import { AttachList, MetaRow, type Attachment, type FieldStatus } from '../../components/facts'
import { Empty, Panel } from '../../components/Panel'
import type { Fund } from '../../data/types'
import { fnum, fdate, fpct } from '../../lib/format'

type Fact = [label: string, status: FieldStatus, value: string | number | null]

const facts = (arr: Fact[]) => arr.map((x, i) => <MetaRow key={i} label={x[0]} status={x[1]} value={x[2]} />)

const ph = <span className="ph">—</span>

export function OverviewPanel({ f }: { f: Fund }) {
  const A: Fact[] = [
    ['Asset Class', 'have', f.ac],
    ['Sub-Asset Class', 'partial', f.sac],
    ['Structure / Vehicle', 'partial', f.structure],
    ['Strategy', 'partial', f.strategy],
    ['Methodology', 'add', null],
    ['Investment Style', 'partial', f.style],
    ['Reference Index / Benchmark', 'add', null],
    ['Region', 'have', f.rg],
    ['Market Type', 'partial', f.mkt],
    ['SFDR', 'partial', f.sfdr],
    ['ESG Rating', 'partial', f.esg === '—' ? null : f.esg],
    ['SRRI / SRI Risk (1–7)', 'add', null],
  ]
  const B: Fact[] = [
    ['Fund Name', 'have', f.n],
    ['Fund ID', 'have', f.fundId],
    ['Issuer / Brand', 'have', f.pv],
    ['Management Company', 'partial', f.mgmtCompany],
    ['Launch / Inception', 'have', fdate(f.inception)],
    ['Domicile', 'have', f.dom],
    ['Umbrella / Legal Entity', 'partial', f.umbrella],
    ['LEI', 'add', null],
    ['Fund Status', 'add', null],
    ['Portfolio Manager + Tenure', 'add', null],
    ['Registered-for-sale Countries', 'add', null],
    ['Tax Classification', 'add', null],
  ]
  return (
    <div className="cols-2" style={{ alignItems: 'start' }}>
      <Panel title="Classification">{facts(A)}</Panel>
      <Panel title="Identity & Legal">{facts(B)}</Panel>
    </div>
  )
}

export function ClassesPanel({ f }: { f: Fund }) {
  return (
    <Panel
      title={
        <>
          Share Classes <span className="muted2">1 fund → many · PK: ISIN</span>
        </>
      }
      bodyStyle={{ padding: 0 }}
    >
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Class</th>
              <th>ISIN</th>
              <th>Launch</th>
              <th>Base Ccy</th>
              <th>Acc/Dist</th>
              <th>Frequency</th>
              <th>Hedged</th>
              <th>Min Inv.</th>
              <th>Other IDs</th>
            </tr>
          </thead>
          <tbody>
            {f.classes.map((c) => (
              <tr key={c.isin}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td className="mono">{c.isin}</td>
                <td>{ph}</td>
                <td>{c.ccy}</td>
                <td>{c.dist === 'Accumulating' ? 'Acc' : 'Dist'}</td>
                <td>{ph}</td>
                <td>{c.hedged}</td>
                <td>{ph}</td>
                <td>{ph}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sub-note">
        Launch date, distribution frequency, currency-hedged flag, minimum investment and secondary IDs (CUSIP · Valoren · FIGI) are on the roadmap.
      </div>
    </Panel>
  )
}

export function ListingsPanel({ f }: { f: Fund }) {
  return (
    <Panel
      title={
        <>
          Listings <span className="muted2">1 class → many · one row per exchange line</span>
        </>
      }
      bodyStyle={{ padding: 0 }}
    >
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Share Class</th>
              <th>Exchange</th>
              <th>Ticker</th>
              <th>Bloomberg</th>
              <th>RIC</th>
              <th>SEDOL</th>
              <th>WKN</th>
              <th>Trading Ccy</th>
              <th>Primary</th>
            </tr>
          </thead>
          <tbody>
            {f.listings.map((l, i) => (
              <tr key={i}>
                <td>{l.cls}</td>
                <td>{l.exch}</td>
                <td style={{ fontWeight: 600 }}>{l.ticker}</td>
                <td className="mono">{l.bbg}</td>
                <td>{ph}</td>
                <td>{ph}</td>
                <td>{ph}</td>
                <td>{l.ccy}</td>
                <td>{l.primary ? <span className="badge master">primary</span> : ph}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sub-note">RIC, SEDOL, WKN and primary-line flag are on the roadmap (per-listing identifiers).</div>
    </Panel>
  )
}

export function HoldingsPanel({ f }: { f: Fund }) {
  if (!f.holdings.length) {
    return (
      <Panel title="Holdings">
        <Empty
          title="No Look-Through Yet"
          desc="Holdings apply to equity and bond sleeves; this product’s holdings are on the roadmap."
          icon="box"
        />
      </Panel>
    )
  }
  return (
    <Panel
      title={
        <>
          Holdings <span className="muted2">child table · top 10 · key (Fund ID, as-of date)</span>
        </>
      }
      bodyStyle={{ padding: 0 }}
    >
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Holding Name</th>
              <th>Geography</th>
              <th>Sector</th>
              <th className="num">Weight</th>
              <th>As-Of</th>
            </tr>
          </thead>
          <tbody>
            {f.holdings.slice(0, 10).map((h) => (
              <tr key={h.name}>
                <td style={{ fontWeight: 600 }}>{h.name}</td>
                <td>{ph}</td>
                <td>{ph}</td>
                <td className="num">{ph}</td>
                <td>{ph}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sub-note">
        Holding names are partially captured; geography, GICS sector and weight + as-of date are needed to make the look-through meaningful (roadmap).
      </div>
    </Panel>
  )
}

function PerfTable({ f }: { f: Fund }) {
  const data: [string, string | null, string | null, string | null, FieldStatus][] = [
    ['1Y', fpct(f.y1), fpct(+(f.y1 - 0.3).toFixed(1)), '−0.30%', 'partial'],
    ['3Y p.a.', null, null, null, 'add'],
    ['5Y p.a.', null, null, null, 'add'],
    ['Since Inception', null, null, null, 'add'],
  ]
  return (
    <>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Period</th>
              <th className="num">Fund</th>
              <th className="num">Index</th>
              <th className="num">Excess</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td className="num">{r[1] ?? ph}</td>
                <td className="num">{r[2] ?? ph}</td>
                <td className="num">{r[3] ?? ph}</td>
                <td>
                  <span className={`sdot ${r[4]}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sub-note">
        Calendar-year, cumulative, since-inception and excess returns across 1M…10Y are on the roadmap (period is a key).
      </div>
    </>
  )
}

export function MeasuresPanel({ f }: { f: Fund }) {
  const eq = f.ac === 'Equity'
  const fi = f.ac === 'Fixed Income'
  const nav = (80 + (f.size % 40)).toFixed(2)
  const grp = (title: string, grain: string, inner: React.ReactNode, flush?: boolean) => (
    <Panel
      title={
        <>
          {title} <span className="muted2">{grain}</span>
        </>
      }
      bodyStyle={flush ? { padding: 0 } : undefined}
    >
      {inner}
    </Panel>
  )

  return (
    <div className="cols-2" style={{ alignItems: 'start' }}>
      {grp(
        'Pricing & Size',
        'fund & class · daily',
        facts([
          ['Fund Net Assets', 'have', fnum(f.size) + ' M USD'],
          ['Share-Class Net Assets', 'partial', fnum(Math.round(f.size * 0.55)) + ' M ' + f.ccy],
          ['NAV per Share', 'partial', nav + ' ' + f.ccy],
          ['ETF Market Price', 'add', null],
          ['Premium / Discount to NAV', 'add', null],
          ['Bid/Ask Spread', 'add', null],
          ['52-Week High / Low', 'partial', (+nav * 1.12).toFixed(2) + ' / ' + (+nav * 0.86).toFixed(2)],
        ]),
      )}
      {grp('Performance', 'class vs index · period is a key', <PerfTable f={f} />, true)}
      {grp(
        'Risk',
        'class · 3Y / 5Y',
        facts([
          ['Risk Indicator (SRRI / SRI 1–7)', 'add', null],
          ['3Y Beta', 'add', null],
          ['Std Deviation / Volatility', 'add', null],
          ['Sharpe / Sortino Ratio', 'add', null],
          ['Alpha', 'add', null],
          ['R²', 'add', null],
          ['Max Drawdown · Up/Down Capture', 'add', null],
        ]),
      )}
      {grp(
        'Benchmark-relative',
        'class vs reference index',
        facts([
          ['Tracking Difference', 'add', null],
          ['Tracking Error', 'add', null],
          ['Information Ratio', 'add', null],
          ['Active Share', 'add', null],
        ]),
      )}
      {eq &&
        grp(
          'Portfolio — Equity',
          'fund',
          facts([
            ['Number of Holdings', 'partial', String(60 + (f.size % 500))],
            ['Price/Earnings', 'add', null],
            ['Price/Book', 'add', null],
            ['Weighted-Avg Market Cap', 'add', null],
            ['Portfolio Turnover', 'partial', '12%'],
            ['Top-10 Concentration %', 'partial', '21.4%'],
            ['ROE · P/Sales · P/CF · Growth', 'add', null],
          ]),
        )}
      {fi &&
        grp(
          'Portfolio — Fixed Income',
          'fund',
          facts([
            ['Effective / Modified Duration', 'add', null],
            ['Yield to Maturity (YTM)', 'add', null],
            ['Average Credit Quality', 'add', null],
            ['Average Maturity · Coupon', 'add', null],
          ]),
        )}
      {grp(
        'Yield / Income',
        'share class',
        facts([
          ['Trailing-12M Yield', 'partial', '1.62%'],
          ['SEC 30-Day Yield', 'add', null],
          ['Distribution Yield', 'partial', '1.74%'],
          ['Dividend / Coupon per Share', 'partial', '0.38 ' + f.ccy],
        ]),
      )}
      {grp(
        'Fees',
        'share class',
        facts([
          ['TER (gross)', 'have', f.cost.toFixed(2) + '%'],
          ['Net Expense Ratio', 'partial', f.cost.toFixed(2) + '%'],
          ['Mgmt Fee · Perf Fee · Loads', 'add', null],
        ]),
      )}
      {grp(
        'Liquidity, Flows & Ratings',
        'fund / class · time series',
        facts([
          ['Shares Outstanding · ADV', 'add', null],
          ['Net Fund Flows', 'add', null],
          ['Morningstar Star Rating', 'add', null],
          ['ESG Score · Carbon Intensity', 'add', null],
        ]),
      )}
    </div>
  )
}

const FUND_DOCS: Attachment[] = [
  { name: 'Factsheet', fmt: 'PDF', meta: 'Updated monthly · 420 KB' },
  { name: 'Key Information Document', fmt: 'PDF', meta: 'Annual · 190 KB' },
  { name: 'Prospectus', fmt: 'PDF', meta: 'Annual · 2.4 MB' },
  { name: 'Annual Report', fmt: 'PDF', meta: 'FY2024 · 3.1 MB' },
  { name: 'Holdings', fmt: 'CSV', meta: 'Daily · 88 KB' },
]

export function DocsPanel() {
  return (
    <Panel title={`Documents · ${FUND_DOCS.length}`}>
      <AttachList items={FUND_DOCS} />
    </Panel>
  )
}
