"""Per-player site-scraper registry + the render bridge.

Each player gets one module here (amundi.py, …) exporting a `SCRAPER`. To add a competitor:
drop in a module, register its SCRAPER below, find its document-link CSS selector by
inspecting the rendered page. Discovery runs in spike/.venv via render_worker (Playwright);
download stays in web.py (stdlib).
"""
from __future__ import annotations
import json
import os
import re
import subprocess
from pathlib import Path

import hashlib

from .base import CompetitorDataScraper, PageSpec
from . import (alliancebernstein, allianz, amundi, amg, blackrock, blackstone, deka, federated, fidelity,
               franklin, goldman, invesco, janus, jpmorgan, morganstanley, pgim, statestreet, swisslife,
               troweprice, ubs, union, vanguard, wisdomtree)

_ROOT = Path(__file__).resolve().parents[2]          # spike/
VENV_PY = _ROOT / ".venv" / "bin" / "python"
_BROWSERS = Path.home() / "Library" / "Caches" / "ms-playwright"

REGISTRY: dict[str, CompetitorDataScraper] = {s.code: s for s in (
    alliancebernstein.SCRAPER, allianz.SCRAPER, amundi.SCRAPER, amg.SCRAPER, blackrock.SCRAPER, blackstone.SCRAPER, deka.SCRAPER, federated.SCRAPER, fidelity.SCRAPER, franklin.SCRAPER,
    goldman.SCRAPER, invesco.SCRAPER, janus.SCRAPER, jpmorgan.SCRAPER, morganstanley.SCRAPER, pgim.SCRAPER,
    statestreet.SCRAPER, swisslife.SCRAPER, troweprice.SCRAPER, ubs.SCRAPER, union.SCRAPER, vanguard.SCRAPER, wisdomtree.SCRAPER)}


def doc_id_for(url: str) -> str:
    """The url-hash doc_id used for browser-downloaded files (matches render_worker)."""
    return "w" + hashlib.sha256(url.encode()).hexdigest()[:16]


def get(code: str) -> CompetitorDataScraper | None:
    return REGISTRY.get(code)


def codes() -> list[str]:
    return sorted(REGISTRY)


def available() -> bool:
    """True when the Playwright venv is present (render worker can run)."""
    return VENV_PY.exists()


def download(code: str, out_dir, skip_ids: set | None = None,
             targets: list[dict] | None = None) -> list[dict]:
    """In-session (browser) download of a player's PDFs, returning [{url, label, group, file}].
    Targets come from one of three sources: an explicit `targets` list (pre-discovered via the
    normal multi-page discover — the download_via_browser flow), the scraper's `resolve()` feed,
    or an in-session `download_extract` on the warmed page."""
    scraper = REGISTRY.get(code)
    if not scraper:
        return []
    if targets is None and not (scraper.browser_download and (scraper.resolve or scraper.download_extract)):
        return []
    if not available():
        print("  ! site-scraper venv missing (spike/.venv) — see requirements-render.txt")
        return []
    spec = {"mode": "download", "warmup": scraper.warmup, "out_dir": str(out_dir)}
    if scraper.channel:
        spec["channel"] = scraper.channel
    if targets is not None:  # pre-discovered (download_via_browser): browser-fetch these URLs
        if skip_ids:
            targets = [t for t in targets if doc_id_for(t["url"]) not in skip_ids]
        if not targets:
            return []
        spec["targets"] = targets
    elif scraper.resolve:  # catalog from a feed (Python) → explicit target list
        targets = scraper.resolve()
        if skip_ids:
            targets = [t for t in targets if doc_id_for(t["url"]) not in skip_ids]
        if not targets:
            return []
        spec["targets"] = targets
    else:  # discover targets in-session on the warmed page (no feed)
        spec["extract"] = scraper.download_extract
        if skip_ids:
            spec["skip_ids"] = list(skip_ids)
    env = {**os.environ, "PLAYWRIGHT_BROWSERS_PATH": str(_BROWSERS)}
    try:
        proc = subprocess.run(
            [str(VENV_PY), "-m", "competitor_ingest.render_worker"],
            input=json.dumps(spec), capture_output=True, text=True,
            timeout=900, env=env, cwd=str(_ROOT))
    except Exception as e:
        print(f"  ! download worker error: {e}")
        return []
    lines = (proc.stdout or "").strip().splitlines()
    if not lines:
        print(f"  ! download worker no output (stderr: {(proc.stderr or '').strip()[:160]})")
        return []
    try:
        data = json.loads(lines[-1])
    except Exception:
        print(f"  ! download worker bad output: {lines[-1][:120]}")
        return []
    return data if isinstance(data, list) else []


def discover(code: str) -> list[tuple[str, str, str]]:
    """Return [(label, url, group)] for a player's JS library via the headless render worker.
    Empty if the player has no scraper or the venv is missing (caller degrades gracefully)."""
    scraper = REGISTRY.get(code)
    if not scraper:
        return []
    if not available():
        print("  ! site-scraper venv missing (spike/.venv) — see requirements-render.txt")
        return []
    env = {**os.environ, "PLAYWRIGHT_BROWSERS_PATH": str(_BROWSERS)}
    spec = scraper.spec()
    if scraper.channel:  # e.g. real Chrome when bundled Chromium is HTTP/2-blocked
        spec["channel"] = scraper.channel
    try:
        proc = subprocess.run(
            [str(VENV_PY), "-m", "competitor_ingest.render_worker"],
            input=json.dumps(spec), capture_output=True, text=True,
            timeout=600, env=env, cwd=str(_ROOT))
    except Exception as e:
        print(f"  ! render worker error: {e}")
        return []
    lines = (proc.stdout or "").strip().splitlines()
    if not lines:
        print(f"  ! render worker no output (stderr: {(proc.stderr or '').strip()[:120]})")
        return []
    try:
        data = json.loads(lines[-1])
    except Exception:
        print(f"  ! render worker bad output: {lines[-1][:120]}")
        return []
    if isinstance(data, dict):  # {"error": ...}
        print(f"  ! render worker: {data.get('error')}")
        return []
    out: list[tuple] = []
    for d in data:
        label = re.sub(r"\s*PDF\s*[\d.,]+\s*[KMGo]+B?\s*$", "", d.get("label", ""), flags=re.I).strip(" -·")
        out.append((label or "Document", d["url"], d.get("group", "Reports"), d.get("id")))
    return out
