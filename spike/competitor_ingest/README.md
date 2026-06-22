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
- `competitor_financials.json` — compact, web-app-ready export (metrics + crawled `documents`)
- `summary.md` — human-readable peer snapshot
- `filings/<id>/<file>` — the actual crawled 10-Ks (real files)
- `cache/` — cached EDGAR responses (re-runs are fast / offline)

## Triggerable, delta-aware crawl + scrape buttons

`crawl.py` is the document crawler: for each competitor it discovers company filings (SEC
EDGAR), IR report PDFs, and JS-rendered libraries (per-player scrapers), downloads only the
delta, re-derives the numbers, and **auto-syncs** the snapshot into the web app.

```bash
cd spike
python3 -m competitor_ingest.crawl            # all competitors, delta ('new') mode
python3 -m competitor_ingest.crawl AMU         # one competitor
python3 -m competitor_ingest.crawl AMU --full  # re-fetch every document (full refresh)
```

- **New** = fetch only documents not already in the archive (fast).
- **Full** (`--full`) = re-fetch everything (catches changed/updated files).

### Per-player scrapers (JS document libraries)

Some IR sites (e.g. Amundi) render their document library client-side — a plain GET sees
nothing. `scrapers/` holds one module per player (`amundi.py`, …) describing the page(s) +
the document-link CSS selector; discovery runs in `.venv` via `render_worker.py` (headless
Chromium), download stays stdlib. **Add a player = one module + registry entry.** Setup:

```bash
python3 -m venv .venv && ./.venv/bin/pip install -r requirements-render.txt
./.venv/bin/python -m playwright install chromium
```

### Scrape buttons (control server)

The Competitor Data Room has **Scrape Full Documents** / **Scrape New Documents** buttons.
They call a tiny local server that runs the crawl and re-syncs the web snapshot:

```bash
cd spike && python3 -m competitor_ingest.server      # :8765 (Vite dev proxies /api → here)
```

### Sync into the web app

```bash
cp out/competitor_ingest/competitor_financials.json ../web/src/data/   # metrics + doc metadata (committed)
rm -rf ../web/public/filings && cp -r out/competitor_ingest/filings ../web/public/   # the crawled files (gitignored)
```

The Competitor Data Room then shows each firm's real 10-K with working **download** + **iframe
preview** (and an Open-at-SEC link). The metadata is committed; the large filings are regenerated.

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
