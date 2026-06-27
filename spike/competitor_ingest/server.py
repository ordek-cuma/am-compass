"""Local control server for the Competitor Data Room scrape buttons.

    cd spike && python3 -m competitor_ingest.server          # serves on :8765

Endpoints (CORS-open; the Vite dev server also proxies /api → here):
    GET  /api/health                      -> {ok, scraperVenv}
    GET  /api/scrapers                    -> {scrapers: {code: name}}   (dedicated site scrapers)
    GET  /api/status?code=AMU             -> {code, name, docs, lastCrawl}
    POST /api/scrape  {code, mode}        -> runs the crawl (mode: 'full' | 'new'), returns
                                             the delta report and re-syncs the web snapshot

A scrape runs synchronously (a local single-user tool); the button shows a spinner. Threaded
so a long scrape doesn't block a health check.
"""
from __future__ import annotations
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from . import config as C
from . import crawl, manifest, scrapers, web

PORT = 8765
ARCHIVE = C.OUT_DIR / "archive"


def _manifest_summary(code: str) -> dict:
    m = manifest.load(ARCHIVE / web.slug(code) / "manifest.json") or {}
    return {"code": code, "name": m.get("name"), "docs": len(m.get("documents", [])),
            "lastCrawl": m.get("last_crawl")}


def _method(code: str) -> str:
    """A short, human description of HOW this player's documents are fetched — for the
    Document Fetcher dashboard."""
    sc = scrapers.get(code)
    if sc is None:
        return "EDGAR filings"
    pages = len(sc.pages) or 1
    if getattr(sc, "download_via_browser", False):
        base = "Browser-download (WAF/Akamai)"
    elif getattr(sc, "browser_download", False):
        base = "Browser-download (in-session)"
    elif getattr(sc, "channel", ""):
        base = "Real-Chrome render"
    else:
        base = "Headless render + stdlib"
    return f"{base} · {pages} page{'s' if pages != 1 else ''}"


def _fetchers() -> list:
    """Status of every dedicated document fetcher (scraper), for the dashboard."""
    out = []
    for code in scrapers.codes():
        s = _manifest_summary(code)
        out.append({
            "code": code, "name": scrapers.get(code).name, "method": _method(code),
            "docs": s["docs"], "lastCrawl": s["lastCrawl"], "ok": s["docs"] > 0})
    return sorted(out, key=lambda r: -r["docs"])


# Tracked competitors that have NO dedicated fetcher, with why — so the dashboard reconciles to
# the full watchlist. "covered" = documents inherited from a parent already fetched; "overlay" =
# numbers-only (parent rollup not crawled); "none" = no public document source.
_NON_FETCHERS = [
    ("PIMCO", "PIMCO", "Covered by Allianz (AGI)", "covered"),
    ("Deka Immobilien", "Deka Immobilien", "Covered by DekaBank (DEKA)", "covered"),
    ("MEAG", "MEAG", "Overlay-only · parent Munich Re", "overlay"),
    ("Universal Invest.", "Universal Investment", "No public source · Bundesanzeiger (captcha)", "none"),
]


def _others() -> list:
    out = []
    for code, name, note, kind in _NON_FETCHERS:
        s = _manifest_summary(code)
        out.append({"code": code, "name": name, "note": note, "kind": kind,
                    "docs": s["docs"], "lastCrawl": s["lastCrawl"]})
    return out


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # CORS preflight
        self._send(204, {})

    def log_message(self, *a) -> None:  # quieter console
        pass

    def do_GET(self) -> None:
        u = urlparse(self.path)
        if u.path == "/api/health":
            return self._send(200, {"ok": True, "scraperVenv": scrapers.available()})
        if u.path == "/api/scrapers":
            return self._send(200, {"scrapers": {c: scrapers.get(c).name for c in scrapers.codes()}})
        if u.path == "/api/fetchers":
            return self._send(200, {"fetchers": _fetchers(), "others": _others()})
        if u.path == "/api/status":
            code = (parse_qs(u.query).get("code") or [""])[0]
            if not code:
                return self._send(400, {"error": "code required"})
            return self._send(200, _manifest_summary(code))
        self._send(404, {"error": "not found"})

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/scrape":
            return self._send(404, {"error": "not found"})
        try:
            length = int(self.headers.get("Content-Length", 0))
            req = json.loads(self.rfile.read(length) or b"{}")
        except Exception as e:
            return self._send(400, {"error": f"bad body: {e}"})
        code = req.get("code")
        mode = req.get("mode", "new")
        if not code:
            return self._send(400, {"error": "code required"})
        if mode not in ("full", "new"):
            return self._send(400, {"error": "mode must be 'full' or 'new'"})
        if code == "*":  # room-level: fetch documents for EVERY competitor
            try:
                report = crawl.run(None, force=(mode == "full"))
            except Exception as e:
                return self._send(500, {"error": f"crawl failed: {e}"})
            return self._send(200, {**report, "code": "*"})
        try:
            report = crawl.run(code, force=(mode == "full"))
        except Exception as e:
            return self._send(500, {"error": f"crawl failed: {e}"})
        row = next((r for r in report["competitors"] if r["code"] == code), None)
        self._send(200, {**report, "code": code, "summary": _manifest_summary(code), "row": row})


def main() -> None:
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Competitor Data Room control server → http://127.0.0.1:{PORT}  (scraper venv: {scrapers.available()})")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
