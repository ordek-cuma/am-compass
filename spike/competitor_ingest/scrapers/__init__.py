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

from .base import CompetitorDataScraper, PageSpec
from . import amundi, blackrock

_ROOT = Path(__file__).resolve().parents[2]          # spike/
VENV_PY = _ROOT / ".venv" / "bin" / "python"
_BROWSERS = Path.home() / "Library" / "Caches" / "ms-playwright"

REGISTRY: dict[str, CompetitorDataScraper] = {s.code: s for s in (amundi.SCRAPER, blackrock.SCRAPER)}


def get(code: str) -> CompetitorDataScraper | None:
    return REGISTRY.get(code)


def codes() -> list[str]:
    return sorted(REGISTRY)


def available() -> bool:
    """True when the Playwright venv is present (render worker can run)."""
    return VENV_PY.exists()


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
    try:
        proc = subprocess.run(
            [str(VENV_PY), "-m", "competitor_ingest.render_worker"],
            input=json.dumps(scraper.spec()), capture_output=True, text=True,
            timeout=300, env=env, cwd=str(_ROOT))
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
    out: list[tuple[str, str, str]] = []
    for d in data:
        label = re.sub(r"\s*PDF\s*[\d.,]+\s*[KMGo]+B?\s*$", "", d.get("label", ""), flags=re.I).strip(" -·")
        out.append((label or "Document", d["url"], d.get("group", "Reports")))
    return out
