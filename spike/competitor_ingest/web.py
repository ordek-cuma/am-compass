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


from urllib.parse import urljoin

_DOC_HINT = re.compile(r"annual|registration|geschäft|geschaeft|results|jahresbericht|report|factsheet|halbjahr|half-?year|urd|10-?k", re.I)


def find_doc_links(html: str, base_url: str, limit: int = 8) -> list[tuple[str, str]]:
    """Discover likely report/document links on an IR page → [(label, absolute_url)].

    Prefers PDFs whose href/anchor text looks like a report (annual/URD/results/…).
    Deduped, capped — a best-effort harvest for non-EDGAR firms.
    """
    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    for m in re.finditer(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html, re.I | re.S):
        href, text = m.group(1), re.sub(r"<[^>]+>", " ", m.group(2))
        text = re.sub(r"\s+", " ", text).strip()
        is_pdf = href.lower().split("?")[0].endswith(".pdf")
        if not is_pdf and not _DOC_HINT.search(href):
            continue
        if not is_pdf and not _DOC_HINT.search(text):
            continue
        absu = urljoin(base_url, href)
        if absu in seen or absu.startswith(("mailto:", "javascript:")):
            continue
        seen.add(absu)
        out.append(((text or "Document")[:80], absu))
        if len(out) >= limit:
            break
    return out
