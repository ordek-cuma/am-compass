"""Triggerable, delta-aware company-document crawler for the Competitor Data Room.

    cd spike && python3 -m competitor_ingest.crawl [CODE]

For each competitor: discover its COMPANY filings (SEC EDGAR for listed firms; IR pages for
the rest), download only what's NEW or CHANGED since the last run (the per-competitor
manifest is the state), re-derive the firm-level numbers, update competitor_financials.json,
and print a delta report. The archive is ours: gitignored + regenerable.

Archive: spike/out/competitor_ingest/archive/<slug>/  (manifest.json + docs/…)
"""
from __future__ import annotations
import datetime as dt
import json
import re
import sys
from pathlib import Path

from . import config as C
from . import derive, edgar, europe_overlay, extract_xbrl, manifest, manual_overlay, registry, scrapers, web

ARCHIVE = C.OUT_DIR / "archive"
WEB_DATA = C.OUT_DIR.parents[2] / "web" / "src" / "data" / "competitor_financials.json"
EDGAR_FORMS = {"10-K", "10-Q", "8-K", "DEF 14A", "DEFA14A", "20-F", "6-K", "40-F", "ARS"}
CAPS = {"8-K": 16, "6-K": 16, "DEFA14A": 4}
SINCE = "2023-01-01"

GROUP = {"10-K": "Annual", "20-F": "Annual", "40-F": "Annual", "ARS": "Annual",
         "10-Q": "Quarterly", "8-K": "Earnings / Events", "6-K": "Earnings / Events",
         "DEF 14A": "Proxy", "DEFA14A": "Proxy"}
NAME = {"10-K": "Annual Report (10-K)", "20-F": "Annual Report (20-F)", "40-F": "Annual Report (40-F)",
        "ARS": "Annual Report to Shareholders", "10-Q": "Quarterly Report (10-Q)",
        "8-K": "Current Report (8-K)", "6-K": "Report (6-K)", "DEF 14A": "Proxy Statement (DEF 14A)",
        "DEFA14A": "Proxy (DEFA14A)"}

GROUP_FILER_CODES = {c.competitor_id for c in registry.GROUP_FILERS}


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


# ---------------------------------------------------------------- EDGAR crawl
def crawl_edgar(code: str, name: str, cik: str, now: str, force: bool = False) -> tuple[list[dict], tuple[int, int, int]]:
    slug = web.slug(code)
    base = ARCHIVE / slug
    prev = manifest.index_by_id(manifest.load(base / "manifest.json"))
    try:
        filings = edgar.recent_filings(cik, EDGAR_FORMS, SINCE, CAPS)
    except Exception as e:
        print(f"  ! filings list failed: {e}")
        filings = []
    docs: list[dict] = []
    new = changed = unchanged = 0
    for f in filings:
        doc_id = f["accession"]
        rel = f"docs/{web.slug(f['form'])}/{doc_id.replace('-', '')}__{f['primaryDocument']}"
        dest = base / rel
        old = prev.get(doc_id)
        if dest.exists() and old and old.get("sha256") and not force:  # 'new' mode: keep known
            sha, status = old["sha256"], "unchanged"
            unchanged += 1
        else:
            try:
                data = edgar.download(f["url"])
            except Exception as e:
                print(f"  ! download {doc_id} failed: {e}")
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            sha = manifest.sha256(data)
            if old:
                changed += 1; status = "changed"
            else:
                new += 1; status = "new"
        ext = f["primaryDocument"].rsplit(".", 1)[-1].lower()
        fmt = {"htm": "HTM", "html": "HTM", "pdf": "PDF", "txt": "TXT"}.get(ext, ext.upper() or "HTM")
        docs.append({
            "doc_id": doc_id, "name": NAME.get(f["form"], f["form"]), "form": f["form"],
            "group": GROUP.get(f["form"], "Other"), "date": f["filingDate"], "fmt": fmt,
            "sizeBytes": dest.stat().st_size if dest.exists() else 0,
            "edgarUrl": f["url"], "file": f"filings/{slug}/{rel}", "sha256": sha,
            "fetched_at": now, "status": status,
        })
    return docs, (new, changed, unchanged)  # caller merges + finalizes the manifest


# ---------------------------------------------------------------- IR/web crawl
_MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


def _label_date(label: str) -> str:
    """Parse a leading date from an IR label → YYYY-MM-DD. Handles 'Mon DD, YYYY' (BlackRock)
    and both dd.mm.yyyy and mm.dd.yyyy (Amundi's English page mixes them); falls back to a
    period-end sentinel."""
    mn = re.match(r"\s*([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})", label)
    if mn and mn.group(1).lower() in _MONTHS:
        return f"{mn.group(3)}-{_MONTHS[mn.group(1).lower()]:02d}-{int(mn.group(2)):02d}"
    m = re.match(r"\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})", label)
    if not m:
        return "2025-12-31"
    a, b, y = int(m.group(1)), int(m.group(2)), m.group(3)
    if a > 12:        # a must be the day → dd.mm
        day, mon = a, b
    elif b > 12:      # b must be the day → mm.dd
        mon, day = a, b
    else:             # ambiguous → assume dd.mm (European)
        day, mon = a, b
    if not (1 <= mon <= 12 and 1 <= day <= 31):
        return "2025-12-31"
    return f"{y}-{mon:02d}-{day:02d}"


def _discover(sources: list[str], pdf_only: bool) -> list[tuple[str, str, str]]:
    """Harvest [(label, url, 'Reports')] of report links from IR/source pages. pdf_only keeps
    just PDFs (for EDGAR firms, whose HTML filings already come from EDGAR)."""
    out: list[tuple[str, str, str]] = []
    for src in sources:
        try:
            body, ct = web.fetch(src)
            html = body.decode("utf-8", "ignore") if "html" in ct.lower() else ""
        except Exception as e:
            print(f"  ! fetch {src} failed: {e}")
            continue
        for label, url in (web.find_doc_links(html, src, limit=12) if html else []):
            if pdf_only and not url.lower().split("?")[0].endswith(".pdf"):
                continue
            out.append((label, url, "Reports"))
    return out


_DOC_EXTS = ("pdf", "xlsx", "xls", "csv")


def _doc_ext(ct: str, url: str) -> str:
    ctl, low = ct.lower(), url.lower().split("?")[0]
    if "pdf" in ctl or low.endswith(".pdf"):
        return "pdf"
    if "spreadsheetml" in ctl or low.endswith(".xlsx"):
        return "xlsx"
    if "ms-excel" in ctl or low.endswith(".xls"):
        return "xls"
    if "csv" in ctl or low.endswith(".csv"):
        return "csv"
    return "html"


def _pull(base, slug: str, prev: dict, targets: list[tuple[str, str, str]], now: str,
          skip_ids: set, force: bool = False, keep_only_docs: bool = False) -> tuple[list[dict], int, int, int]:
    """Download each (label, url, group) target into the archive, deduped by url-hash doc_id
    and against skip_ids. A primary-disclosure ('Annual') target that won't fetch is kept as a
    live source link. keep_only_docs keeps only real documents (PDF / Excel / CSV) and drops
    HTML pages — scraper-backed players harvest documents, not landing pages. In 'new' mode
    (force=False) docs already on disk are kept without re-downloading — only genuinely new
    ones are fetched; 'full' (force=True) re-fetches every target. Returns (docs, n, c, u)."""
    docs: list[dict] = []
    new = changed = unchanged = 0
    local: set[str] = set()
    for label, url, group, *rest in targets:
        # Stable id from the scraper (e.g. a form+date label) keeps the doc_id constant when the
        # URL is volatile (Federated's per-session tokens); else fall back to the url hash.
        stable = rest[0] if (rest and rest[0]) else url
        doc_id = "w" + manifest.sha256(stable.encode())[:16]
        if doc_id in skip_ids or doc_id in local:
            continue
        local.add(doc_id)
        old = prev.get(doc_id)
        if not force and old and old.get("file") and (ARCHIVE / old["file"].split("/", 1)[1]).exists():
            kept = dict(old); kept["status"] = "unchanged"  # 'new' mode: don't re-fetch known docs
            docs.append(kept); unchanged += 1
            continue
        try:
            data, ct = web.fetch(url)
        except Exception:
            if not old and group == "Annual":
                docs.append({"doc_id": doc_id, "name": label, "form": "IR", "group": group,
                             "date": "2025-12-31", "fmt": "WEB", "sizeBytes": 0, "edgarUrl": url,
                             "file": "", "sha256": "", "fetched_at": now, "status": "source"})
            continue
        ext = _doc_ext(ct, url)
        if keep_only_docs and ext not in _DOC_EXTS:  # scraper players: PDF/Excel only, no HTML
            continue
        rel = f"docs/{doc_id}.{ext}"
        dest = base / rel
        sha = manifest.sha256(data)
        if old and dest.exists() and old.get("sha256") == sha:
            status = "unchanged"; unchanged += 1
        else:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            if old:
                changed += 1; status = "changed"
            else:
                new += 1; status = "new"
        date = _label_date(label)
        docs.append({"doc_id": doc_id, "name": label, "form": "IR", "group": group,
                     "date": date, "fmt": ext.upper(), "sizeBytes": len(data),
                     "edgarUrl": url, "file": f"filings/{slug}/{rel}", "sha256": sha,
                     "fetched_at": now, "status": status})
    return docs, new, changed, unchanged


def _finalize(code: str, name: str, cik: str | None, slug: str, prev: dict,
              docs: list[dict], now: str) -> list[dict]:
    """Carry forward every prior/​on-disk doc not re-discovered this run, then save the merged
    manifest once. A delta crawl must never lose an archived doc (e.g. a transient 403)."""
    base = ARCHIVE / slug
    seen = {d["doc_id"] for d in docs}
    for did, old in prev.items():  # prior entries (EDGAR + IR) whose file survives
        if did in seen:
            continue
        f = old.get("file", "")
        if f and (ARCHIVE / f.split("/", 1)[1]).exists():
            carried = dict(old); carried["status"] = "carried"
            docs.append(carried); seen.add(did)
    docdir = base / "docs"
    for fp in sorted(docdir.glob("w*")) if docdir.exists() else []:  # orphaned IR files
        if fp.stem in seen or not fp.is_file():
            continue
        docs.append({"doc_id": fp.stem, "name": "Crawled document", "form": "IR", "group": "Reports",
                     "date": "2025-12-31", "fmt": fp.suffix.lstrip(".").upper(),
                     "sizeBytes": fp.stat().st_size, "edgarUrl": "",
                     "file": f"filings/{slug}/docs/{fp.name}", "sha256": manifest.sha256(fp.read_bytes()),
                     "fetched_at": now, "status": "carried"}); seen.add(fp.stem)
    manifest.save(base / "manifest.json",
                  {"code": code, "name": name, "cik": cik, "last_crawl": now, "documents": docs})
    return docs


def harvest_ir(code: str, now: str, prev: dict, skip_ids: set, pdf_only: bool, force: bool = False) -> tuple[list[dict], tuple[int, int, int]]:
    """Download report PDFs from a competitor's registered IR_SOURCES (supplements EDGAR)."""
    sources = registry.IR_SOURCES.get(code, [])
    if not sources:
        return [], (0, 0, 0)
    slug = web.slug(code)
    docs, n, c, u = _pull(ARCHIVE / slug, slug, prev, _discover(sources, pdf_only), now, skip_ids, force)
    return docs, (n, c, u)


def _scrape_player(code: str, name: str, cik: str | None, now: str, force: bool) -> tuple[list[dict], tuple[int, int, int]] | None:
    """If the player has a dedicated Competitor Data Scraper, harvest its document library
    (PDFs only, authoritative) and finalize the manifest. Returns (docs, counts) or None."""
    sc = scrapers.get(code)
    if sc is None:
        return None
    if getattr(sc, "browser_download", False):
        return _scrape_download(code, name, cik, now, force)
    scraped = scrapers.discover(code)
    if not scraped:
        return None
    if getattr(sc, "download_via_browser", False):  # listing renders, but PDF URLs 403 via stdlib
        targets = [{"url": u, "label": l, "group": g} for (l, u, g, *_rest) in scraped]
        return _scrape_download(code, name, cik, now, force, targets=targets)
    slug = web.slug(code)
    base = ARCHIVE / slug
    prev = manifest.index_by_id(manifest.load(base / "manifest.json"))
    docs, n, c, u = _pull(base, slug, prev, scraped, now, skip_ids=set(), force=force, keep_only_docs=True)
    _finalize(code, name, cik, slug, prev, docs, now)
    return docs, (n, c, u)


def _scrape_download(code: str, name: str, cik: str | None, now: str, force: bool,
                     targets: list[dict] | None = None) -> tuple[list[dict], tuple[int, int, int]]:
    """Browser-download scraper (bot-protected PDFs, e.g. Goldman/Akamai): the worker fetches
    the files in-session; we build manifest entries from them. 'new' mode skips known docs.
    `targets` (when given) are pre-discovered via the normal multi-page discover — the
    download_via_browser flow, where the listing renders fine but the PDF URLs 403 via stdlib."""
    slug = web.slug(code)
    base = ARCHIVE / slug
    prev = manifest.index_by_id(manifest.load(base / "manifest.json"))
    skip = set() if force else set(prev)
    got = scrapers.download(code, base / "docs", skip_ids=skip, targets=targets)
    docs: list[dict] = []
    new = 0
    for g in got:
        fp = Path(g["file"])
        if not fp.exists():
            continue
        data = fp.read_bytes()
        label = g.get("label") or "Document"
        my = re.search(r"20\d\d", label)
        docs.append({
            "doc_id": scrapers.doc_id_for(g["url"]), "name": label, "form": "IR",
            "group": g.get("group", "Reports"), "date": f"{my.group(0)}-12-31" if my else "2025-12-31",
            "fmt": (fp.suffix.lstrip(".").upper() or "PDF"), "sizeBytes": len(data),
            "edgarUrl": g["url"], "file": f"filings/{slug}/{fp.relative_to(base).as_posix()}",
            "sha256": manifest.sha256(data), "fetched_at": now, "status": "new"})
        new += 1
    docs = _finalize(code, name, cik, slug, prev, docs, now)
    return docs, (new, 0, 0)


def crawl_edgar_full(code: str, name: str, cik: str, now: str, force: bool = False) -> tuple[list[dict], tuple[int, int, int]]:
    """Dedicated scraper if the player has one; else EDGAR filings + supplemental IR PDFs."""
    scraped = _scrape_player(code, name, cik, now, force)
    if scraped is not None:
        return scraped
    slug = web.slug(code)
    prev = manifest.index_by_id(manifest.load(ARCHIVE / slug / "manifest.json"))
    edocs, (en, ec, eu) = crawl_edgar(code, name, cik, now, force)
    idocs, (jn, jc, ju) = harvest_ir(code, now, prev, {d["doc_id"] for d in edocs}, pdf_only=True, force=force)
    docs = _finalize(code, name, cik, slug, prev, edocs + idocs, now)
    return docs, (en + jn, ec + jc, eu + ju)


def crawl_web(code: str, name: str, regime: str, src: str, now: str, force: bool = False) -> tuple[list[dict], tuple[int, int, int]]:
    scraped = _scrape_player(code, name, None, now, force)  # dedicated scraper is authoritative
    if scraped is not None:
        return scraped
    slug = web.slug(code)
    base = ARCHIVE / slug
    prev = manifest.index_by_id(manifest.load(base / "manifest.json"))
    # No dedicated scraper: harvest only REAL documents (PDF/Excel) linked from the IR source(s).
    # The IR landing page itself is the competitor's source link (from europe_overlay), not a
    # "document" — an HTML page is not a report, and the Document Data Room stays PDF-only. Firms
    # with no downloadable reports at their source (e.g. Universal Investment, MEAG) correctly show
    # zero documents rather than marketing-page noise.
    sources = [src] + [s for s in registry.IR_SOURCES.get(code, []) if s != src]
    targets = _discover(sources, pdf_only=True)
    docs, n, c, u = _pull(base, slug, prev, targets, now, skip_ids=set(), force=force, keep_only_docs=True)
    _finalize(code, name, None, slug, prev, docs, now)
    return docs, (n, c, u)


# ---------------------------------------------------------------- numbers
def _metrics_block(obs: list) -> dict:
    """Per metric_key: the latest value (flat, for the table) + up-to-5y `history`, and for
    breakdown ('by-X') metrics the `members` of the latest period."""
    from .schema import METRIC_CATALOG
    by_key: dict[str, list] = {}
    for o in obs:
        by_key.setdefault(o.metric_key, []).append(o)
    out: dict[str, dict] = {}
    for key, lst in by_key.items():
        cut = METRIC_CATALOG.get(key, {}).get("cut")
        if cut:  # breakdown metric — emit the members of the latest period
            period = max(o.period_end for o in lst)
            members = [{"member": o.member, "value": o.value, "confidence": o.confidence}
                       for o in lst if o.period_end == period and o.member and o.value is not None]
            if not members:
                continue
            base = next(o for o in lst if o.period_end == period)
            out[key] = {"unit": base.unit, "basis": base.basis, "period_end": period,
                        "confidence": round(min(m["confidence"] for m in members), 2),
                        "source": base.source_doc, "section": base.source_section,
                        "members": sorted(members, key=lambda m: -(m["value"] or 0))}
            continue
        scalars = [o for o in lst if not o.member and o.value is not None]
        if not scalars:
            continue
        latest = max(scalars, key=lambda o: o.period_end)
        per: dict[str, object] = {}
        for o in scalars:  # one (highest-confidence) obs per period
            cur = per.get(o.period_end)
            if cur is None or o.confidence > cur.confidence:
                per[o.period_end] = o
        history = [{"period_end": p, "value": h.value, "basis": h.basis, "confidence": h.confidence}
                   for p, h in sorted(per.items(), reverse=True)][:5]
        out[key] = {"value": latest.value, "unit": latest.unit, "basis": latest.basis,
                    "confidence": latest.confidence, "source": latest.source_doc,
                    "section": latest.source_section, "period_end": latest.period_end,
                    "history": history}
    return out


def _doc_export(docs: list[dict]) -> list[dict]:
    keys = ("name", "form", "group", "date", "fmt", "sizeBytes", "edgarUrl", "file")
    return [{k: d.get(k) for k in keys} for d in sorted(docs, key=lambda d: (d.get("group", ""), d.get("date", "")), reverse=True)]


def refresh_metrics() -> dict:
    """Re-extract metrics for every competitor and rewrite competitor_financials.json, REUSING
    the documents already in the snapshot (no doc crawl). Fast and safe — never regresses doc
    counts on flaky sources. Use after a metric-schema / overlay change."""
    now = _now()
    fp = C.OUT_DIR / "competitor_financials.json"
    prev = json.loads(fp.read_text()) if fp.exists() else {"competitors": {}}
    prev_comp = prev.get("competitors", {})
    export = {"generated_at": now, "source": prev.get("source", "SEC EDGAR + IR (delta crawl)"),
              "competitors": {}}

    def block(cid: str, obs: list) -> dict:
        b = dict(prev_comp.get(cid, {}))
        b["metrics"] = _metrics_block(obs)
        b["period_end"] = max((o.period_end for o in obs if not o.member), default=b.get("period_end"))
        return b

    for comp in registry.BELLWETHERS:
        cid = comp.competitor_id
        try:
            obs = extract_xbrl.extract(cid, edgar.companyfacts(registry.resolve(comp)), now)
        except Exception as e:
            print(f"  ! {cid} xbrl: {e}"); obs = []
        obs += manual_overlay.overlay(cid, now)
        obs += derive.derive(cid, obs, now)
        export["competitors"][cid] = block(cid, obs)

    for comp in registry.GROUP_FILERS:
        cid = comp.competitor_id
        obs = europe_overlay.build(cid, now)
        obs += derive.derive(cid, obs, now)
        export["competitors"][cid] = block(cid, obs)

    for cid in europe_overlay.EUROPE:
        if cid in GROUP_FILER_CODES:
            continue
        obs = europe_overlay.build(cid, now)
        obs += derive.derive(cid, obs, now)
        export["competitors"][cid] = block(cid, obs)

    for cid, blk in prev_comp.items():  # carry forward anything not regenerated
        export["competitors"].setdefault(cid, blk)

    fp.write_text(json.dumps(export, indent=2), encoding="utf-8")
    synced = sync_web(fp)
    print(f"refreshed metrics for {len(export['competitors'])} competitors · web synced: {synced}")
    return {"competitors": len(export["competitors"]), "webSynced": synced}


def run(only: str | None = None, force: bool = False) -> dict:
    now = _now()
    prev_fin = {}
    fp = C.OUT_DIR / "competitor_financials.json"
    if fp.exists():
        prev_fin = json.loads(fp.read_text()).get("competitors", {})
    export = {"generated_at": now, "source": "SEC EDGAR + IR (delta crawl)", "competitors": {}}
    all_obs = []
    delta_rows = []

    def want(code: str) -> bool:
        return only is None or only == code

    # 1) Pure-play EDGAR bellwethers: docs + XBRL financials + AM overlay
    for comp in registry.BELLWETHERS:
        if not want(comp.competitor_id):
            continue
        cik = registry.resolve(comp)
        print(f"• {comp.name} ({comp.competitor_id}) EDGAR {cik}")
        docs, counts = crawl_edgar_full(comp.competitor_id, comp.name, cik, now, force)
        try:
            obs = extract_xbrl.extract(comp.competitor_id, edgar.companyfacts(cik), now)
        except Exception as e:
            print(f"  ! xbrl failed: {e}"); obs = []
        obs += manual_overlay.overlay(comp.competitor_id, now)
        obs += derive.derive(comp.competitor_id, obs, now)
        all_obs += obs
        export["competitors"][comp.competitor_id] = {
            "name": comp.name, "ticker": comp.ticker, "regime": comp.regime, "cik": cik,
            "period_end": max((o.period_end for o in obs), default=None),
            "documents": _doc_export(docs), "metrics": _metrics_block(obs)}
        delta_rows.append((comp.competitor_id, len(docs), counts))

    # 2) Group filers: company docs from EDGAR, AM-segment numbers from europe_overlay
    for comp in registry.GROUP_FILERS:
        if not want(comp.competitor_id):
            continue
        cik = registry.resolve(comp)
        print(f"• {comp.name} ({comp.competitor_id}) EDGAR {cik} [group filer · docs only]")
        docs, counts = crawl_edgar_full(comp.competitor_id, comp.name, cik, now, force)
        obs = europe_overlay.build(comp.competitor_id, now)
        obs += derive.derive(comp.competitor_id, obs, now)
        all_obs += obs
        spec = europe_overlay.EUROPE.get(comp.competitor_id, {})
        export["competitors"][comp.competitor_id] = {
            "name": spec.get("name", comp.name), "ticker": comp.ticker,
            "regime": spec.get("regime", comp.regime), "cik": cik, "period_end": "2025-12-31",
            "documents": _doc_export(docs), "metrics": _metrics_block(obs)}
        delta_rows.append((comp.competitor_id, len(docs), counts))

    # 3) Remaining non-EDGAR firms (European/German/private): IR document crawl
    for cid, spec in europe_overlay.EUROPE.items():
        if cid in GROUP_FILER_CODES or not want(cid):
            continue
        print(f"• {spec['name']} ({cid}) IR crawl")
        docs, counts = crawl_web(cid, spec["name"], spec["regime"], spec["src"], now, force)
        obs = europe_overlay.build(cid, now)
        obs += derive.derive(cid, obs, now)
        all_obs += obs
        export["competitors"][cid] = {
            "name": spec["name"], "ticker": cid, "regime": spec["regime"], "cik": None,
            "period_end": "2025-12-31", "documents": _doc_export(docs), "metrics": _metrics_block(obs)}
        delta_rows.append((cid, len(docs), counts))

    if only is None:
        fp.write_text(json.dumps(export, indent=2), encoding="utf-8")
    else:  # merge a single-competitor crawl into the existing snapshot
        merged = json.loads(fp.read_text()) if fp.exists() else {"competitors": {}}
        merged["generated_at"] = now
        merged.setdefault("competitors", {}).update(export["competitors"])
        fp.write_text(json.dumps(merged, indent=2), encoding="utf-8")

    synced = sync_web(fp)
    _report(delta_rows, prev_fin, export["competitors"])
    return {
        "mode": "full" if force else "new", "only": only, "generated_at": now, "webSynced": synced,
        "competitors": [{"code": c, "docs": n, "new": nn, "changed": cc}
                        for c, n, (nn, cc, _u) in delta_rows],
        "totalDocs": sum(n for _c, n, _t in delta_rows),
        "new": sum(t[0] for _c, _n, t in delta_rows),
        "changed": sum(t[1] for _c, _n, t in delta_rows),
    }


def sync_web(fp) -> bool:
    """Copy the committed snapshot into the web app so the UI updates (HMR picks it up)."""
    try:
        if WEB_DATA.parent.exists():
            WEB_DATA.write_text(fp.read_text(encoding="utf-8"), encoding="utf-8")
            return True
    except Exception as e:
        print(f"  ! web sync failed: {e}")
    return False


def _report(delta_rows, prev_fin, cur_fin) -> None:
    print("\n=== DELTA REPORT ===")
    tot_new = tot_chg = tot_docs = 0
    for code, ndocs, (new, chg, unch) in delta_rows:
        tot_new += new; tot_chg += chg; tot_docs += ndocs
        flag = f"  (+{new} new, {chg} changed)" if (new or chg) else ""
        print(f"  {code:16} {ndocs:3} docs{flag}")
    print(f"  ── total {tot_docs} documents · {tot_new} new · {tot_chg} changed")
    # metric changes
    changes = []
    for code, blk in cur_fin.items():
        pm = prev_fin.get(code, {}).get("metrics", {})
        for k, m in blk["metrics"].items():
            pv = pm.get(k, {}).get("value")
            if pv != m["value"]:
                changes.append(f"  {code}.{k}: {pv} → {m['value']}")
    if changes:
        print("\n=== NUMBERS CHANGED ===")
        print("\n".join(changes[:40]))
    print()


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a]
    force = "--full" in args
    only = next((a for a in args if not a.startswith("-")), None)
    run(only, force=force)
