"""Per-site headless scrapers for JS-rendered IR document libraries (Amundi-style) whose
documents a plain HTTP GET can't see. Discovery runs in spike/.venv via render_worker
(Playwright); download stays in web.py (stdlib). Add a competitor by adding a SITE_SCRAPERS
entry — find the document-link CSS selector by inspecting the rendered page.
"""
from __future__ import annotations
import json
import os
import re
import subprocess
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent          # spike/
VENV_PY = _ROOT / ".venv" / "bin" / "python"
_BROWSERS = Path.home() / "Library" / "Caches" / "ms-playwright"

# code -> {pages: [{url, selector, label_attr, group, scroll}]}. The selector targets the
# document-download anchors; label_attr is where the human title lives (aria-label/title).
SITE_SCRAPERS: dict[str, dict] = {
    # Amundi: docs served via a Nuxeo DMS — anchors are /files/nuxeo/dl/<uuid> with NO .pdf
    # extension, English titles in aria-label. The whole set loads at once (year/quarter tabs
    # only filter the view) once the cookie banner is dismissed (handled in render_worker).
    "AMU": {"pages": [
        {"url": "https://about.amundi.com/financial-results",
         "selector": "a[href*='/files/nuxeo/dl/']", "label_attr": "aria-label",
         "group": "Reports", "scroll": 12},
        {"url": "https://about.amundi.com/legal-documentation",
         "selector": "a[href*='/files/nuxeo/dl/']", "label_attr": "aria-label",
         "group": "Annual", "scroll": 12},
    ]},
}


def available() -> bool:
    """True when the Playwright venv is present (render worker can run)."""
    return VENV_PY.exists()


def discover(code: str) -> list[tuple[str, str, str]]:
    """Return [(label, url, group)] for a JS site via the headless render worker. Empty list
    if the firm has no scraper or the venv is missing (caller degrades to the static crawl)."""
    spec = SITE_SCRAPERS.get(code)
    if not spec:
        return []
    if not available():
        print("  ! site-scraper venv missing (spike/.venv) — see requirements-render.txt")
        return []
    env = {**os.environ, "PLAYWRIGHT_BROWSERS_PATH": str(_BROWSERS)}
    try:
        proc = subprocess.run(
            [str(VENV_PY), "-m", "competitor_ingest.render_worker"],
            input=json.dumps(spec), capture_output=True, text=True,
            timeout=300, env=env, cwd=str(_ROOT))
    except Exception as e:
        print(f"  ! render worker error: {e}")
        return []
    line = (proc.stdout or "").strip().splitlines()
    if not line:
        print(f"  ! render worker no output (stderr: {(proc.stderr or '').strip()[:120]})")
        return []
    try:
        data = json.loads(line[-1])
    except Exception:
        print(f"  ! render worker bad output: {line[-1][:120]}")
        return []
    if isinstance(data, dict):  # {"error": ...}
        print(f"  ! render worker: {data.get('error')}")
        return []
    out: list[tuple[str, str, str]] = []
    for d in data:
        label = re.sub(r"\s*PDF\s*[\d.,]+\s*[KMGo]+B?\s*$", "", d.get("label", ""), flags=re.I).strip(" -·")
        out.append((label or "Document", d["url"], d.get("group", "Reports")))
    return out
