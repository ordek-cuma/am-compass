"""Minimal SEC EDGAR client — stdlib only, polite (User-Agent + rate limit + cache).

Endpoints used:
  - company_tickers.json          ticker -> CIK resolution
  - submissions/CIK##########.json recent filings (find the latest 10-K/20-F)
  - api/xbrl/companyfacts/...json  machine-readable GAAP financials
"""
from __future__ import annotations
import hashlib
import json
import time
import urllib.request
from pathlib import Path
from typing import Any

from . import config as C

_last_request = 0.0


def _throttle() -> None:
    global _last_request
    wait = C.SEC_MIN_INTERVAL - (time.time() - _last_request)
    if wait > 0:
        time.sleep(wait)
    _last_request = time.time()


def _cache_path(url: str) -> Path:
    h = hashlib.sha1(url.encode()).hexdigest()[:16]
    return C.CACHE_DIR / f"{h}.json"


def get_json(url: str, *, use_cache: bool = True) -> Any:
    """GET JSON with on-disk caching. Cache makes re-runs fast and offline-friendly."""
    cp = _cache_path(url)
    if use_cache and cp.exists():
        return json.loads(cp.read_text(encoding="utf-8"))
    _throttle()
    req = urllib.request.Request(url, headers={"User-Agent": C.SEC_UA, "Accept-Encoding": "gzip, deflate"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        if resp.headers.get("Content-Encoding") == "gzip":
            import gzip

            raw = gzip.decompress(raw)
        data = json.loads(raw.decode("utf-8"))
    cp.parent.mkdir(parents=True, exist_ok=True)
    cp.write_text(json.dumps(data), encoding="utf-8")
    return data


def get_text(url: str) -> str:
    """GET a document (e.g. the 10-K primary file). Cached as raw text."""
    cp = C.CACHE_DIR / (hashlib.sha1(url.encode()).hexdigest()[:16] + ".txt")
    if cp.exists():
        return cp.read_text(encoding="utf-8", errors="ignore")
    _throttle()
    req = urllib.request.Request(url, headers={"User-Agent": C.SEC_UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        text = resp.read().decode("utf-8", errors="ignore")
    cp.parent.mkdir(parents=True, exist_ok=True)
    cp.write_text(text, encoding="utf-8")
    return text


def resolve_cik(ticker: str) -> str | None:
    """Map a ticker to a zero-padded 10-digit CIK via the official ticker file."""
    data = get_json("https://www.sec.gov/files/company_tickers.json")
    t = ticker.upper()
    for row in data.values():
        if row.get("ticker", "").upper() == t:
            return str(row["cik_str"]).zfill(10)
    return None


def submissions(cik: str) -> dict:
    return get_json(f"https://data.sec.gov/submissions/CIK{cik}.json")


def companyfacts(cik: str) -> dict:
    return get_json(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json")


def recent_filings(cik: str, forms: set[str], since: str = "2023-01-01", cap_per_form: dict | None = None) -> list[dict]:
    """All recent filings of the given forms since `since`, newest first.

    Returns {form, accession, primaryDocument, filingDate, url}. cap_per_form bounds noisy
    forms (e.g. {'8-K': 12}). Drives the delta crawl off EDGAR's submissions index.
    """
    cap_per_form = cap_per_form or {}
    recent = submissions(cik)["filings"]["recent"]
    out: list[dict] = []
    counts: dict[str, int] = {}
    n = len(recent["form"])
    for i in range(n):  # submissions are newest-first
        form = recent["form"][i]
        if form not in forms:
            continue
        date = recent["filingDate"][i]
        if date < since:
            continue
        cap = cap_per_form.get(form)
        counts[form] = counts.get(form, 0) + 1
        if cap and counts[form] > cap:
            continue
        acc = recent["accessionNumber"][i]
        accn = acc.replace("-", "")
        doc = recent["primaryDocument"][i]
        if not doc:
            continue
        out.append({
            "form": form, "accession": acc, "primaryDocument": doc, "filingDate": date,
            "url": f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accn}/{doc}",
        })
    return out


def download(url: str) -> bytes:
    """Binary fetch with the SEC User-Agent + throttle (for archiving filing documents)."""
    _throttle()
    req = urllib.request.Request(url, headers={"User-Agent": C.SEC_UA})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.read()


def latest_annual_filing(cik: str) -> dict | None:
    """Return {form, accession, primaryDocument, filingDate, url} for the most recent 10-K/20-F."""
    recent = submissions(cik)["filings"]["recent"]
    for i, form in enumerate(recent["form"]):
        if form in ("10-K", "20-F"):
            acc = recent["accessionNumber"][i].replace("-", "")
            doc = recent["primaryDocument"][i]
            return {
                "form": form,
                "accession": recent["accessionNumber"][i],
                "primaryDocument": doc,
                "filingDate": recent["filingDate"][i],
                "url": f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{acc}/{doc}",
            }
    return None
