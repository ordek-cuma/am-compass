import type { Dataset } from "../types";
import { pct, pctRaw, money, signed, aumDelta } from "../format";

export default function MarketView({ data }: { data: Dataset }) {
  const { records, inventory } = data;
  const fi = records.filter((r) => r.group === "fixed_income");
  const eq = records.filter((r) => r.group === "equity");
  const totalAum = records.reduce((s, r) => s + (r.aum_now || 0), 0);
  const full = inventory.filter((i) => i.tier === "full");
  const docs = inventory.filter((i) => i.tier === "docs-only");

  return (
    <div className="stack">
      <div className="grid cards4">
        <Metric label="Products in scope" value={String(records.length)} />
        <Metric label="Tracked AUM" value={money(totalAum)} />
        <Metric label="Issuers in crawl" value={String(inventory.length)} />
        <Metric label="Structured-data issuers" value={`${full.length} / ${inventory.length}`} />
      </div>

      <div className="panel">
        <h3 className="section-title">Offering inventory — iShares EU-UCITS (fixed income + equity)</h3>
        <p className="sub">Fees, performance and concentration computed from crawled fund data. Compare the field within a segment.</p>
        <PeerTable title="Fixed income" rows={fi} />
        <div style={{ height: 18 }} />
        <PeerTable title="Equity" rows={eq} />
      </div>

      <div className="panel">
        <h3 className="section-title">Issuer coverage — where structured data exists today</h3>
        <p className="sub">
          The crawl is heterogeneous: only the “full” tier carries machine-readable fees/holdings/series.
          Docs-only issuers need the PDF/LLM parser before they enter the comparison engine.
        </p>
        <table>
          <thead>
            <tr><th>Issuer</th><th>Tier</th><th className="num">Products</th><th className="num">Structured</th><th className="num">Docs</th></tr>
          </thead>
          <tbody>
            {inventory
              .slice()
              .sort((a, b) => b.product_count - a.product_count)
              .map((i) => (
                <tr key={i.issuer}>
                  <td>{i.issuer}</td>
                  <td><span className={tierClass(i.tier)}>{i.tier}</span></td>
                  <td className="num">{i.product_count}</td>
                  <td className="num">{i.pct_fund_data_xls}%</td>
                  <td className="num">{i.pct_documents_json}%</td>
                </tr>
              ))}
          </tbody>
        </table>
        <div style={{ height: 12 }} />
        <div className="note-banner">
          <span className="highlight">{full.length} of {inventory.length} issuers</span> are full-pipeline ready
          ({full.map((i) => i.issuer).join(", ")}). <span className="highlight">{docs.length}</span> are docs-only —
          the v1 build lift is the PDF/LLM parser that brings them into scope.
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function PeerTable({ title, rows }: { title: string; rows: Dataset["records"] }) {
  if (!rows.length) return null;
  const ters = rows.map((r) => r.ter).filter((x): x is number => x != null);
  const medTer = ters.length ? ters.sort((a, b) => a - b)[Math.floor(ters.length / 2)] : null;
  return (
    <>
      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>{title}</div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th className="num">TER</th>
            <th className="num">3y net</th>
            <th className="num">Vol</th>
            <th className="num">AUM</th>
            <th className="num">AUM Δ 3m</th>
            <th className="num">Top-10</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const d = aumDelta(r.aum_now, r.aum_prev);
            const cheap = medTer != null && r.ter != null && r.ter < medTer;
            return (
              <tr key={r.portfolioId}>
                <td>{r.name.replace("iShares ", "")}</td>
                <td className={`num ${cheap ? "pos" : ""}`}>{pctRaw(r.ter ? r.ter : null)}</td>
                <td className="num">{pct(r.perf.return_3y_net)}</td>
                <td className="num">{pct(r.perf.volatility_ann)}</td>
                <td className="num">{money(r.aum_now)}</td>
                <td className={`num ${d != null ? (d >= 0 ? "pos" : "neg") : ""}`}>{signed(d)}</td>
                <td className="num">{r.top10_weight != null ? `${r.top10_weight.toFixed(0)}%` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function tierClass(tier: string): string {
  return tier === "full" ? "tier-full" : tier === "docs-only" ? "tier-docs" : "tier-sparse";
}
