"""Generic web fetcher for non-EDGAR documents (IR/results pages), browser User-Agent.

Corporate sites (unlike SEC) don't gate on a specific UA. Used to build the offline
archive for European/German/private/group-filer competitors.
"""
from __future__ import annotations
import re
import urllib.request

_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Compass/1.0"


def slug(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_")


def fetch(url: str, timeout: int = 25) -> tuple[bytes, str]:
    """Return (bytes, content_type). Raises on HTTP/network error."""
    req = urllib.request.Request(url, headers={"User-Agent": _UA, "Accept": "text/html,application/pdf,*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get("Content-Type", "")
