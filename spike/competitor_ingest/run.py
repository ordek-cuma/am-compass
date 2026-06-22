"""Phase-1 orchestrator: harvest (EDGAR) -> extract (XBRL + optional LLM) -> derive -> write.

    cd spike && python3 -m competitor_ingest.run

Writes to spike/out/competitor_ingest/:
  - observations.json            every MetricObservation (the audit-grade record)
  - competitor_financials.json   compact, web-app-ready export (one block per competitor)
  - summary.md                   human-readable peer snapshot
Network required (SEC EDGAR). LLM KPIs only when ANTHROPIC_API_KEY is set.
"""
from __future__ import annotations
import datetime as dt
import json

from . import config as C
from . import derive, edgar, extract_llm, extract_xbrl, manual_overlay, registry
from .schema import METRIC_CATALOG

HEADLINE = ["aum_total", "net_flows", "total_revenue", "mgmt_fee_revenue", "operating_income",
            "operating_margin", "net_income", "eps_diluted", "effective_fee_rate", "organic_growth_rate"]


def _fmt(o) -> str:
    if o.value is None:
        return "—"
    if o.unit == "USD":
        return f"${o.value / 1e9:,.1f}B"
    if o.unit == "pct":
        return f"{o.value:.1f}%"
    if o.unit == "bps":
        return f"{o.value:.1f}bps"
    if o.unit == "USD/shares":
        return f"${o.value:,.2f}"
    if o.unit == "count":
        return f"{int(o.value):,}"
    return f"{o.value:,.0f}"


def run() -> None:
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    C.OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_obs = []
    export = {"generated_at": now, "source": "SEC EDGAR (companyfacts + 10-K)", "competitors": {}}

    for comp in registry.BELLWETHERS:
        cik = registry.resolve(comp)
        print(f"• {comp.name} ({comp.ticker}) CIK {cik}")
        try:
            facts = edgar.companyfacts(cik)
        except Exception as e:
            print(f"  ! companyfacts failed: {e}")
            continue

        obs = extract_xbrl.extract(comp.competitor_id, facts, now)
        print(f"  xbrl: {len(obs)} financial metrics")

        # Harvest the actual filing → save the crawled file + record it as a document.
        filing = edgar.latest_annual_filing(cik)
        documents = []
        if filing:
            html = edgar.get_text(filing["url"])
            rel = f"filings/{comp.competitor_id}/{filing['primaryDocument']}"
            fpath = C.OUT_DIR / rel
            fpath.parent.mkdir(parents=True, exist_ok=True)
            fpath.write_text(html, encoding="utf-8")
            documents.append({
                "name": f"Annual Report ({filing['form']})",
                "form": filing["form"], "date": filing["filingDate"], "fmt": "HTM",
                "sizeBytes": len(html.encode("utf-8")),
                "edgarUrl": filing["url"], "file": rel,
            })
            print(f"  crawled: {filing['form']} {filing['filingDate']} → {rel} ({len(html)//1024} KB)")
            if C.ANTHROPIC_API_KEY:
                kpis = extract_llm.extract(comp.competitor_id, html, filing["url"], now)
                print(f"  llm:  {len(kpis)} AM KPIs")
                obs += kpis

        ov = manual_overlay.overlay(comp.competitor_id, now, filing["url"] if filing else "")
        if ov:
            print(f"  overlay: {len(ov)} hand-verified AM KPIs")
        obs += ov
        obs += derive.derive(comp.competitor_id, obs, now)
        all_obs += obs

        latest = {}
        for o in obs:
            cur = latest.get(o.metric_key)
            if cur is None or o.period_end > cur.period_end:
                latest[o.metric_key] = o
        export["competitors"][comp.competitor_id] = {
            "name": comp.name,
            "ticker": comp.ticker,
            "regime": comp.regime,
            "cik": cik,
            "period_end": max((o.period_end for o in obs), default=None),
            "documents": documents,
            "metrics": {
                k: {"value": o.value, "unit": o.unit, "basis": o.basis, "confidence": o.confidence,
                    "source": o.source_doc, "section": o.source_section}
                for k, o in latest.items()
            },
        }

    (C.OUT_DIR / "observations.json").write_text(
        json.dumps([o.to_dict() for o in all_obs], indent=2), encoding="utf-8")
    (C.OUT_DIR / "competitor_financials.json").write_text(json.dumps(export, indent=2), encoding="utf-8")
    _write_summary(export, now)
    print(f"\n✓ {len(all_obs)} observations across {len(export['competitors'])} competitors → {C.OUT_DIR}")


def _write_summary(export: dict, now: str) -> None:
    lines = ["# Competitor financials — Phase 1 (US-listed via SEC EDGAR)", "",
             f"_Generated {now} · source: {export['source']}_", ""]
    cols = ["Competitor"] + [METRIC_CATALOG[k]["label"] for k in HEADLINE]
    lines.append("| " + " | ".join(cols) + " |")
    lines.append("|" + "|".join(["---"] * len(cols)) + "|")
    for cid, blk in export["competitors"].items():
        row = [f"{blk['name']} ({blk['ticker']})"]
        for k in HEADLINE:
            m = blk["metrics"].get(k)
            row.append("—" if not m or m["value"] is None else _fmt_val(m))
        lines.append("| " + " | ".join(row) + " |")
    lines += ["", "Empty cells for AuM / flows / fee revenue need the LLM extractor "
              "(set `ANTHROPIC_API_KEY` and re-run) — the 10-Ks are already fetched and cached."]
    (C.OUT_DIR / "summary.md").write_text("\n".join(lines), encoding="utf-8")


def _fmt_val(m: dict) -> str:
    v, u = m["value"], m["unit"]
    if u == "USD":
        a = abs(v)
        if a >= 1e12:
            return f"${v / 1e12:,.1f}T"
        if a >= 1e9:
            return f"${v / 1e9:,.1f}B"
        return f"${v / 1e6:,.0f}M"
    if u == "pct":
        return f"{v:.1f}%"
    if u == "bps":
        return f"{v:.1f}bps"
    if u == "USD/shares":
        return f"${v:,.2f}"
    if u == "count":
        return f"{int(v):,}"
    return f"{v:,.0f}"


if __name__ == "__main__":
    run()
