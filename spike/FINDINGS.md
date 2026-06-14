# AM Compass — v1 walking-skeleton spike: FINDINGS

_Run date: 2026-06-14 · scope: iShares EU-UCITS FI+equity (6 products) + cross-issuer recon · pure-stdlib Python, fully offline, crawl read-only._

## Verdict
**The core bet holds.** The full loop `crawl → parse → diff → signal → TWR → cited brief` runs end-to-end on real crawl data and passes the acceptance gate:
- ✅ 26 signals across 6 products (mostly REAL; 1 labelled-constructed)
- ✅ TWR + risk computed for 4 products with ≥3y history (2 others are recent launches → correctly fire launch signals)
- ✅ cited brief with 5 claims, **0 uncited** (citation invariant enforced in code)

Artifacts: `out/records.json`, `out/signals.json`, `out/brief.json`, `out/brief.md`, `out/inventory.json`.

## What was proven
- **Performance is license-free.** `data/fund_data.xls` (iShares) carries a daily total-return index + benchmark index + NAV + AUM back to inception. TWR (net & gross = net+TER), volatility, Sharpe, max-drawdown, and 3y tracking difference all computed from it. Example real outputs: Edge MSCI USA Quality 3y net +19.95%; Corp Bond +5.4%, tracking diff −0.16%; AAA CLO Active flagged as a 2026-04-29 launch.
- **Holdings + fees are rule-parseable.** TER (`Gesamtkostenquote (TER)`) and full holdings (3,119 lines for Corp Bond) extracted deterministically. Concentration (top-10 weight) computed: CLO Active 35.9% vs Corp Bond 2.7% — sane.
- **Signals are real, not hand-waved.** fee_positioning & performance_positioning (cross-sectional vs peer median), aum_trend (flow proxy from the AUM series), tracking_difference, concentration, launch — all derived from data.
- **The citation invariant works.** `brief.compose()` raises `UncitedClaimError` if any claim lacks a valid signal id; the brief renders an evidence index linking every claim to its `S-####` signals.

## Open spec questions — now answered with evidence

### §G3 — Model-portfolio sourcing
**Gap confirmed.** The crawl is fund/ETF-centric; no model-portfolio / SMA products are present. Model-portfolio coverage cannot come from the current crawl and needs a separate sourcing path (deferred to v2 per locked scope — this validates that deferral).

### §G4 — Entity resolution & crawl heterogeneity (the big one)
The crawl is **highly heterogeneous**. Of 22 issuers, only **3 carry the structured `fund_data.xls`**: **iShares (1,269 prods), StateStreet/SPDR (173), VanEck (87)**. The other ~19 (incl. Amundi, Vanguard, Fidelity, BNP Paribas, Invesco, Schwab + the India/Taiwan houses) are **docs-only** — `documents.json` + PDFs, no structured fees/holdings/series.
- **Implication:** the full structured pipeline (TWR, holdings, tracking) works *today* only for iShares/SPDR/VanEck (and SPDR/VanEck likely need their own xls-adapter — format not yet verified). Covering the full competitor set requires the **PDF/LLM parse path** (the "LLM" half of the hybrid decision) to lift fees/holdings/performance out of PDFs — this is the single biggest v1 build lift.
- **Join key:** ISIN is the reliable cross-issuer identifier — present in `documents.json` for docs-only issuers and in `fund_data.xls` characteristics for structured ones. Folder naming differs (iShares = portfolioId, Amundi/others = ISIN/local code), so resolve on ISIN, not folder.
- **Data hygiene:** iCloud `… 2.<ext>` duplicates are pervasive in the synced (structured) issuers — iShares 100%, SPDR 96%, VanEck 96% of sampled products. The ingest **must dedupe** on filename/content-hash before parsing.

### §G5 — Crawl cadence & versioning
The crawl is a **single point-in-time snapshot** (e.g., Corp Bond holdings "as of 28-Mai-2026"); there is **no version history**, so true temporal diffs (a fee CUT, holdings drift) cannot be observed yet — hence the one fee_change signal is a labelled CONSTRUCTED demo. To make the diff engine real, ingest needs a **scheduled re-crawl with content-hash versioning** so consecutive snapshots can be diffed. Cadence proposal: holdings/NAV weekly, KIID/fees on-change, annual reports on-publish.

## Recommended next steps (post-spike)
1. **Verify the SPDR + VanEck xls formats** and generalize the adapter (gets 3 issuers fully structured).
2. **Stand up the PDF/LLM parser** for docs-only issuers (fees + headline holdings) — unlocks the full competitor set; this is the critical-path build item.
3. **Add scheduled re-crawl + content-hash versioning** → real temporal signals (fee cuts, holdings drift).
4. **Dedupe ingest** (iCloud `… 2.` artifacts) on content-hash.
5. Then decide §G6 (stack/hosting) and turn this skeleton into the v1 service.

## How to run
```
cd spike
python3 run_spike.py      # the end-to-end loop → out/
python3 s1_inventory.py   # cross-issuer structure recon → out/inventory.json
```
No dependencies (stdlib only). Reads `~/Desktop/ishares_offline` read-only; writes only under `spike/out/`.
