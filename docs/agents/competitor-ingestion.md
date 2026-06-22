# Agent spec — Competitor document ingestion

The first agent in AM Compass. It turns the **Competitor Radar** watchlist into the
**Competitor Data Room**: it fetches each competitor's primary documents from the right
source and extracts a structured, comparable, **source-cited** set of financial metrics.

It is **not** a deep research agent — it's a disciplined harvest + extraction pipeline,
routed by each competitor's **disclosure regime** (the Radar "Category").

---

## Architecture — two stages

| Stage | Job | Nature |
|---|---|---|
| **A · Harvester** | discover + download the right documents for a competitor | source-specific, mostly deterministic (APIs/crawlers) |
| **B · Extractor** | pull structured `MetricObservation` rows from those documents | document-specific (XBRL parsing + LLM reading) |

They're separate because acquisition and extraction have different sources, cadences,
idempotency, and failure modes.

### Source routing (by Category)

| Category | Primary source | Harvest |
|---|---|---|
| **US-listed** (incl. group filers) | SEC EDGAR | 10-K + XBRL `companyfacts`; group filers (MS/GS/JPM/PGIM/State Street) via the parent's filing |
| **Private / Mutual** | SEC IAPD + fund filings | Form ADV (Part 1 + Brochure 2A), fund annual reports, N-CSR |
| **European-listed** | IR sites | Universal Registration Document, half-year report, earnings deck/transcript |
| **German KVG** | Bundesanzeiger + firm sites | fund Jahresberichte, Bundesanzeiger filings, Master-/Service-KVG brochures |

Other documents that feed the same pipeline (all categories): quarterly earnings releases +
presentations + transcripts, Capital Markets Day decks, fund factsheets/KIDs, holdings
filings (N-PORT/N-CEN — **gold for the ops stack**: custodian/depositary/administrator/auditor),
sustainability/SFDR/TCFD reports, press releases, and careers pages (tech-stack signals).

---

## The schema (what makes it comparable)

One **`MetricObservation`** per `(competitor, metric, period)`. Every number carries its
provenance and caveats so the peer set is auditable — this extends the spike's **citation
invariant** (no claim without a linked source) to every metric.

```
MetricObservation {
  competitor_id, metric_key, value, unit, currency,
  period_type (FY|H1|Q1..Q4), period_end, basis (GAAP|adjusted|reported),
  definition_note,                 # captures per-firm "definition drift"
  source_doc, source_url, source_section,
  confidence (0..1), extracted_by, extracted_at
}
```

A `metric_catalog` defines each `metric_key` (canonical label, unit, definition, and the
us-gaap concept(s) that satisfy it deterministically). Metric groups follow the spec:
**Scale (AuM), Flows, Revenue & fees, Profitability, Workforce, Capital, Business-mix**.

### Conventions (standardized at extraction)
- **Period & currency** captured on every observation; firms report USD/EUR/GBP → convert downstream via an `fx_rates` table keyed on `period_end`.
- **Definition drift** — store the firm's stated definition alongside the value.
- **GAAP vs adjusted** — capture both where given (`basis`); adjusted is more comparable across US firms, GAAP across Europeans.
- **Confidence + provenance** — XBRL = 1.0; LLM carries the model's confidence + a source quote.

### Derived metrics (computed, never extracted)
- `operating_margin = operating_income / total_revenue`
- `effective_fee_rate = mgmt_fee_revenue / average_AuM` (bps) — the margin-compression story
- `organic_growth_rate = net_flows / opening_AuM` (annualized) — the cleanest cross-firm growth comparator

Computed from base observations with `confidence = min(inputs)` and the input keys recorded.

---

## Phasing

1. **Phase 1 — US-listed via SEC EDGAR** ✅ *(built — see below)*
2. **Phase 2 — European-listed (URD via IR sites)** — heavier layout-aware PDF extraction
3. **Phase 3 — German KVG (Bundesanzeiger + Jahresberichte) + Form ADV for private firms**
4. **Phase 4 — Holdings (N-PORT) + ops-stack intel (service providers)** → feeds the signals engine

---

## Phase 1 — status

Built at [`spike/competitor_ingest/`](../../spike/competitor_ingest/). Stdlib-only harvest +
XBRL extraction; the LLM extractor is stdlib HTTP to the Claude API, gated on a key.

**Verified live against EDGAR** for 5 bellwethers (BlackRock, T. Rowe Price, Invesco, Franklin
Resources, AllianceBernstein Holding): 21 observations, GAAP financials accurate with full
provenance (e.g. BlackRock FY2025 revenue $24.2B / op-income $7.0B / EPS $35.31, op-margin 29.1%).

**What's deterministic now (no key):** total revenue, operating income, net income, diluted EPS,
operating margin — straight from XBRL `companyfacts`, confidence 1.0.

**What needs the LLM step (`ANTHROPIC_API_KEY`):** the AM-specific KPIs with no standard XBRL
concept — **AuM (total/average), net flows, management-fee revenue, performance fees, headcount** —
read from the 10-K MD&A. The 10-Ks are already discovered and cached; setting the key and re-running
fills these and unlocks `effective_fee_rate` + `organic_growth_rate`.

**Known nuances / refinements**
- **AllianceBernstein Holding (AB)** is a pass-through holding LP → only net income is tagged on its
  CIK. Point it at the operating partnership **AllianceBernstein L.P. (CIK 0001109448)** for full financials.
- Group filers (MS/GS/JPM/PGIM/State Street) need parent-CIK routing + segment-note extraction for the AM segment.

---

## Next steps
- Run the LLM extractor (set `ANTHROPIC_API_KEY`) to populate AuM/flows/fee metrics.
- **Web integration:** a **Financials tab** on the Competitor Data Room detail page (mirrors the fund
  **Measures** tab), reading `spike/out/competitor_ingest/competitor_financials.json`, with the status-dot
  availability model (green = high-confidence, amber = derived/low-confidence, grey = pending).
- Phase 2 (European URD) once Phase 1 is wired into the UI.
