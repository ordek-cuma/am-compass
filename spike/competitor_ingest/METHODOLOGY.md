# AM Compass — Financial Data Methodology

How every number in the competitor cockpit is sourced, graded, and refreshed. The live,
self-updating version of this ledger is in the app at **Settings › Data Fetcher › Financial
Fetcher** (it reads the actual provenance stamped on each value).

## Core principle: the citation invariant

**Never fabricate a number. A missing value is recorded as "Not disclosed"; it is never guessed.**
Every value carries its source document, a verbatim quote/section, a confidence, and a **basis**
that grades how it was obtained. Estimates and third-party figures are allowed (see below) but are
*labelled as such* and visually distinguished (amber dot, "estimate"/"tracker" tag) — they are
never presented as filed facts.

## The trust ladder (`basis`)

| basis | meaning | dot |
|-------|---------|-----|
| `GAAP` / `reported` | taken from a regulatory filing or the company's own disclosure | green (conf ≥ 0.9) |
| `external` | a reputable third-party tracker, attributed and dated | amber |
| `estimate` | a transparent model estimate; the method is shown on the value | amber |
| `derived` | a ratio computed in-pipeline from base metrics of the same period | grey |

## Sources (vendors), ranked by trust

### Tier 1 — regulatory filings & company disclosure
- **SEC EDGAR — XBRL company facts** (`vendor: xbrl`). Machine-readable GAAP financials for every
  US filer (revenue, operating/net income, EPS, dividends, buybacks), last 5 fiscal years,
  period-aligned. Auto-updates when a new 10-K/20-F is filed. Concept selection is per-metric, with
  per-firm overrides where a filer tags a non-standard concept (e.g. Janus Henderson total revenue
  → `RevenueFromContractWithCustomerIncludingAssessedTax`).
- **SEC 10-K — MD&A table parser** (`vendor: table-parse`). AuM-by-asset-class/region/channel and
  fee lines parsed from 10-K tables. **Reconciliation guard:** a breakdown is recorded only if its
  members sum to within ~8% of the firm's *known* total AuM/revenue — a mis-identified table is
  rejected, never recorded wrong.
- **SEC 10-K / 8-K — hand-verified** (`vendor: analyst`). Headline figures (AuM, flows, headcount,
  market cap, dividends) read verbatim from US filings / earnings releases into a cited overlay.
- **Annual reports & results — Europe** (`vendor: analyst-eu`). Cited figures from European annual
  reports, Universal Registration Documents, and FY results releases. Native currency → USD at a
  **stated period-end FX rate** (EUR 1.08, CHF 1.10, GBP 1.27; the native figure + rate stay on the
  value). Per-share metrics (dividends, EPS) are FX-converted but not scaled to billions.
- **SEC Form ADV (IAPD)** (`vendor: form-adv`). Item 5 regulatory AUM (RAUM), adviser-entity staff
  (5.A) and account counts (5.F) for each firm's primary US registered adviser. Source:
  `reports.adviserinfo.sec.gov/reports/ADV/<CRD>/PDF/<CRD>.pdf` + the SEC bulk Form ADV dataset.

  > **Entity-scope caveat (important).** Form ADV is filed *per legal entity*, not per brand. Large
  > complexes split assets and staff across many registered advisers — e.g. BlackRock's ~$14tn spans
  > BlackRock Fund Advisors, BlackRock Advisors LLC, BlackRock International, etc.; BlackRock Fund
  > Advisors alone reports $4.28tn RAUM and 128 employees (the iShares index arm). So **Form ADV RAUM
  > ≠ the firm's marketed AUM** and **Form ADV employees ≠ firm headcount**. These are recorded as
  > distinct metrics (`raum`, `ria_employees`, `ria_accounts`) and **never overwrite** `aum_total` or
  > `headcount` — they are a regulatory cross-check and texture layer, with each entity's CRD on it.

### Tier 2 — third-party trackers (attributed)
- **Market data & industry trackers** (`vendor: tracker`). Used only where the company discloses
  nothing firm-level: market capitalisation (e.g. stockanalysis.com, dated), and fund flows from
  trackers (e.g. Morningstar US fund-flows). Always attributed and dated.

### Tier 3 — transparent estimates
- **Model estimate** (`vendor: estimate`). A clearly-flagged estimate where no figure is published
  *at all*. The method is on every value. Examples: Vanguard revenue (≈ 0.07% asset-weighted fee ×
  average AUM, as the at-cost mutual structure publishes no income statement); Federated firmwide
  net flows (long-term reported + money-market AUM change at constant $1 NAV).

### Tier 4 — derived
- **Derived (computed)** (`vendor: derive`). Ratios computed from base metrics of the *same* fiscal
  year so history never mixes years: operating margin, P/E (market cap ÷ net income, skipped on a
  loss), organic growth (net flows ÷ opening AuM), effective fee rate, AuM/revenue per employee,
  % passive/alternatives.

## Time-series history & coverage

Where a firm publishes a history, scalar metrics carry a **multi-year series** (up to FY2021–FY2025),
newest-first, each year individually cited. This holds for **net flows** and **total AuM** across all
listed bellwethers and segment/European filers, and for revenue/income wherever XBRL or the firm's
own report supplies prior years.

- **One flow convention per firm.** Net-flow definitions are not uniform (total vs long-term vs
  third-party vs net-inflows-before-realizations). Each firm's series uses a *single* convention,
  named in every year's citation, so the trend is internally comparable. Do **not** compare a
  "third-party" series against a "total" series across firms.
- **Structural breaks are flagged** in the citation where a merger/scope change distorts the trend
  (UBS↔Credit Suisse 2023, BNPP↔AXA IM 2025, Janus↔Guardian 2025, Amundi↔Lyxor 2021).
- The **Flows tab** renders the Net-flows + Total-AuM series as bar charts; outflow (negative) bars
  are coloured rose so a mixed inflow/outflow series reads correctly.

### Completeness view — Settings › Data Fetcher › Coverage

A live **37-competitor × 10-metric** matrix (`web/src/features/settings/CoverageMatrix.tsx`) grading
every cell, reading the same committed snapshot so it always reflects current coverage:

- **green** — complete: a time-series with **≥3 years**, or a present point/breakdown
- **orange** — partial: present but a short **1–2 year** series
- **red** — no data

The cell number is the count of years of history. At the last refresh: ~51% green / ~16% orange /
~32% red. Best-covered: net flows (28/37 ≥3yr), headcount (29/37), AuM (24/37), revenue-mix (25/37),
AuM-mix (23/37). **Next gap:** Revenue / Operating-margin / Net-income are still mostly single-year
(orange) for the European/private firms — extending P&L to a multi-year series is the natural
follow-up.

## Known structural gaps (not sourcing failures)

- **Group-filer AM-segment headcount** (MS IM, GSAM, PGIM, SSgA, UBS AM, Natixis) — parents report
  employees group-wide only; Form ADV gives the US adviser entity only (entity-scoped).
- **German private KVGs** (MEAG, BayernInvest, Universal, HSBC INKA, Union total revenue) — P&L is
  Bundesanzeiger-only and the FY2025 statutory accounts are not yet filed (German GmbHs have 12
  months → expect Q3–Q4 2026). The roadmap source for these is **Northdata / Bundesanzeiger**.
- **Vanguard** — at-cost mutual; no parent income statement exists. Operating margin is the
  **UK-entity-only** Companies House series (Vanguard Asset Management Ltd, 8.9–11.6%, clearly
  labelled — *not* global); revenue is a flagged estimate; the asset-class split is a coarse
  bond/MMF-vs-residual external figure (Vanguard publishes no clean dollar split). Net flows are the
  Morningstar US family series (2021/2022/2024/2025; **2023 is a genuine Morningstar reporting gap**).
- **Capital tab** (market cap, P/E) — structurally impossible for group-filer *segments* (not
  separately traded) and private firms (not listed). Populated for the 10 publicly-traded pure-plays.

## Refresh

`cd spike && python3 -c "from competitor_ingest import crawl; crawl.refresh_metrics()"` re-extracts
every metric and rewrites `web/src/data/competitor_financials.json` — reusing the already-crawled
documents (no re-crawl). Run it after any schema / overlay / connector change.

## Roadmap sources (recommended next connectors)

| Source | Fills | Access | Trust |
|--------|-------|--------|-------|
| Financial Modeling Prep / Alpha Vantage API | self-refreshing market cap, P/E, prices, statements | freemium API | Tier 2 |
| UK Companies House API | UK-domiciled managers' filed accounts | free official API | Tier 1 |
| Northdata / Bundesanzeiger | German KVG P&L (once FY2025 files) | paid API | Tier 1 |
| ICI fund-flow reports | US industry + money-market flows | free CSV | Tier 2 |
| SEC 13F | manager holdings / positioning (new dimension) | free (EDGAR) | Tier 1 |
| Morningstar Direct / Preqin | fund flows, ratings, SFDR, private-markets AUM | paid | Tier 1–2 |
