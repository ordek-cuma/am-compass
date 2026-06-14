import type { Dataset, Signal } from "../types";
import { pct, signalClass, signalLabel } from "../format";

export default function DossierView({ data }: { data: Dataset }) {
  const { brief, signals, records } = data;
  const byId = new Map(signals.map((s) => [s.id, s]));
  const launches = signals.filter((s) => s.type === "launch");
  const aum = signals.filter((s) => s.type === "aum_trend");

  return (
    <div className="stack">
      <div className="panel">
        <div className="row-flex" style={{ justifyContent: "space-between" }}>
          <div className="brand" style={{ fontSize: 15 }}>
            <span className="logo" style={{ borderRadius: 7 }}>iS</span>
            {brief.issuer}
          </div>
          <span className="badge b-green">
            {brief.n_claims} claims · {brief.n_signals} signals · {brief.uncited_claims} uncited
          </span>
        </div>
        <p className="sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Inferred from observable moves across {records.length} products. Every claim links to the
          underlying signal — hover a tag to see the evidence.
        </p>
      </div>

      <div className="panel">
        <h3 className="section-title">Inferred strategy</h3>
        {brief.claims.map((c, i) => (
          <div className="claim" key={i}>
            <p>
              {c.text}{" "}
              {!c.inferred && <span className="faint" style={{ fontSize: 12 }}>(mechanism demo)</span>}
            </p>
            <div>
              {c.cited_signal_ids.map((id) => {
                const s = byId.get(id);
                return (
                  <span className="cite" key={id} title={s ? `${s.entity.name} — ${s.note}` : id}>
                    {id}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid cards2">
        <div className="panel">
          <h3 className="section-title">Recent launches</h3>
          {launches.length ? (
            launches.map((s) => <SignalLine key={s.id} s={s} />)
          ) : (
            <p className="muted">No launches in window.</p>
          )}
        </div>
        <div className="panel">
          <h3 className="section-title">Asset momentum (flow proxy)</h3>
          {aum.map((s) => <SignalLine key={s.id} s={s} />)}
        </div>
      </div>

      <div className="panel">
        <h3 className="section-title">Performance & risk behind the read</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">3y net</th>
              <th className="num">3y gross</th>
              <th className="num">Sharpe</th>
              <th className="num">Max DD</th>
              <th className="num">Tracking Δ 3y</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.portfolioId}>
                <td>{r.name.replace("iShares ", "")}</td>
                <td className="num">{pct(r.perf.return_3y_net)}</td>
                <td className="num">{pct(r.perf.return_3y_gross)}</td>
                <td className="num">{r.perf.sharpe != null ? r.perf.sharpe.toFixed(2) : "—"}</td>
                <td className="num neg">{pct(r.perf.max_drawdown)}</td>
                <td className="num">{pct(r.perf.tracking_difference_3y, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="faint" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          TWR computed in-house from the crawl (gross = net + TER). No licensed data.
        </p>
      </div>
    </div>
  );
}

function SignalLine({ s }: { s: Signal }) {
  return (
    <div className="sig">
      <span className={`badge ${signalClass(s.type)}`}>{signalLabel(s.type)}</span>
      <div className="body">
        <div className="note">{s.entity.name.replace("iShares ", "")}</div>
        <div className="meta">{s.note}</div>
      </div>
    </div>
  );
}
