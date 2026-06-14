import { useState } from "react";
import datasetJson from "./data/dataset.json";
import type { Dataset } from "./types";
import MarketView from "./components/MarketView";
import DossierView from "./components/DossierView";
import SignalsView from "./components/SignalsView";

const data = datasetJson as unknown as Dataset;

type Tab = "market" | "dossier" | "signals";

const TABS: { id: Tab; label: string }[] = [
  { id: "market", label: "Market structure" },
  { id: "dossier", label: "Competitor strategy" },
  { id: "signals", label: "Signals" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("market");
  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="logo">◎</span>
          AM Compass
        </div>
        <span className="lens">{data.scope}</span>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "market" && <MarketView data={data} />}
      {tab === "dossier" && <DossierView data={data} />}
      {tab === "signals" && <SignalsView data={data} />}

      <p className="faint" style={{ fontSize: 12, marginTop: 28 }}>
        Walking skeleton · data computed from the local crawl as of {data.generated_at} ·{" "}
        {data.records.length} products, {data.signals.length} signals.
      </p>
    </div>
  );
}
