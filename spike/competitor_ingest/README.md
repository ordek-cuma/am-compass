# competitor_ingest — Phase 1

Harvest + extract competitor financials from SEC EDGAR. Full spec:
[`docs/agents/competitor-ingestion.md`](../../docs/agents/competitor-ingestion.md).

## Run

```bash
cd spike
python3 -m competitor_ingest.run
```

Requires network (SEC EDGAR). Writes to `spike/out/competitor_ingest/` (gitignored):

- `observations.json` — every `MetricObservation` (audit-grade, source-cited)
- `competitor_financials.json` — compact, web-app-ready export (one block per competitor)
- `summary.md` — human-readable peer snapshot
- `cache/` — cached EDGAR responses + 10-Ks (re-runs are fast / offline)

Covers **9 US-listed pure-play AMs** (BlackRock, T. Rowe, Invesco, Franklin, AllianceBernstein,
Federated Hermes, WisdomTree, Janus Henderson, AMG) — see `registry.py`.

## What you get

- **No key:** GAAP financials from XBRL `companyfacts` — total revenue, operating income,
  net income, diluted EPS, operating margin (confidence 1.0, full provenance) — plus AuM +
  headcount + select net-flows from `manual_overlay.py` (hand-read from the 10-Ks, cited).
- **With `ANTHROPIC_API_KEY`:** the remaining AM KPIs (management-fee revenue, performance fees,
  per-class flows) read from the 10-K tables, which unlock `effective_fee_rate`.

```bash
export ANTHROPIC_API_KEY=sk-...           # optional — enables the AM-KPI extractor
export COMPASS_EXTRACT_MODEL=claude-sonnet-4-6   # optional override
export COMPASS_SEC_UA="Your Name (you@example.com)"  # optional SEC User-Agent
```

## Modules

| File | Role |
|---|---|
| `registry.py` | the 5 US-listed bellwethers + live CIK resolution |
| `edgar.py` | polite EDGAR client (User-Agent, rate-limit, on-disk cache) |
| `schema.py` | `MetricObservation` + the metric catalogue |
| `extract_xbrl.py` | deterministic GAAP financials from `companyfacts` |
| `extract_llm.py` | optional Claude extraction of AM KPIs from the 10-K |
| `derive.py` | operating margin, effective fee rate, organic growth |
| `run.py` | orchestrator → writes the outputs above |

Reads nothing from the iShares crawl; writes only under `spike/out/`.
