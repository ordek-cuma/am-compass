# AM Compass

**Asset Management Compass** — a product & strategy competitive-intelligence cockpit for asset managers. It monitors competitors' ETFs, portfolios, documents (factsheets, KIIDs, holdings, annual reports) and news, and **reverse-engineers their company & product strategy** from observable moves — with every inferred claim traced back to a source signal (no black box).

Two altitudes:
- **Market structure (top-down):** what's offered in a segment, who does what, and where the market is structurally moving (e.g. open-ended → SMA / direct-indexing).
- **Competitor (bottom-up):** reverse-engineer a specific issuer's strategy from launches, fee moves, holdings drift, registrations and disclosure changes.

> Not a Similarweb/Ahrefs digital-marketing clone — web/SEO/ad signals are out of scope. The moat is deep document/holdings intelligence + a signals engine + strategy inference.

## Status
v1 walking-skeleton spike (proves `crawl → parse → diff → signal → TWR → cited brief` on real data). See [`spike/FINDINGS.md`](spike/FINDINGS.md).

```
cd spike && python3 run_spike.py     # end-to-end loop → spike/out/
cd spike && python3 s1_inventory.py  # cross-issuer structure recon
```
Pure stdlib, offline. Reads the local crawl read-only; writes only under `spike/out/`.
