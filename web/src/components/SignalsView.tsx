import { useMemo, useState } from "react";
import type { Dataset } from "../types";
import { signalClass, signalLabel } from "../format";

export default function SignalsView({ data }: { data: Dataset }) {
  const { signals } = data;
  const types = useMemo(
    () => ["all", ...Array.from(new Set(signals.map((s) => s.type)))],
    [signals]
  );
  const [filter, setFilter] = useState("all");
  const shown = filter === "all" ? signals : signals.filter((s) => s.type === filter);

  return (
    <div className="stack">
      <div className="panel">
        <h3 className="section-title">Signal feed</h3>
        <p className="sub">
          {signals.length} signals detected this run. Most are real (computed from crawl data); the
          constructed fee-move is labelled — true temporal diffs need a second crawl snapshot.
        </p>
        <div className="filterbar">
          {types.map((t) => (
            <button
              key={t}
              className={`chip ${filter === t ? "on" : ""}`}
              onClick={() => setFilter(t)}
            >
              {t === "all" ? "All" : signalLabel(t)}
            </button>
          ))}
        </div>
        <div>
          {shown.map((s) => (
            <div className="sig" key={s.id}>
              <span className={`badge ${signalClass(s.type)}`}>{signalLabel(s.type)}</span>
              <div className="body">
                <div className="note">
                  {s.entity.name.replace("iShares ", "")}{" "}
                  <span className="faint" style={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}>
                    {s.id}
                  </span>
                </div>
                <div className="meta">{s.note}</div>
              </div>
              <span
                className={`badge ${s.method === "constructed-demo" ? "b-amber" : "b-gray"}`}
                title="detection method"
              >
                {s.method}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
