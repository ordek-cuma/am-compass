"""Competitor ingestion agent (Phase 1).

Two stages, both source-routed by the competitor's disclosure regime (the Radar
"Category"):
  - Harvester  : discover + download the right documents from the right source.
  - Extractor  : pull structured MetricObservation rows from those documents.

Phase 1 covers US-listed bellwethers via SEC EDGAR:
  - deterministic XBRL extraction of GAAP financials (no LLM, no key), plus
  - optional LLM extraction of AM-specific KPIs (AuM, flows, fee rate) from the 10-K.

Reads nothing from the iShares crawl; writes only under spike/out/competitor_ingest/.
Run:  cd spike && python3 -m competitor_ingest.run
"""
