"""DWS Group (DWS) — Competitor Data Scraper.

group.dws.com IR serves annual reports, quarterly results and investor presentations as
download.dws.com/download?elib-assetguid=… links (NO .pdf extension), so the generic EU_PDF
extract misses them — a DWS-specific extract catches the download.dws.com anchors. Labels come
from the link text; year from text/filename; PDFs download via the bundled browser.
"""
from .base import CompetitorDataScraper, PageSpec

_DWS_PDF = r"""
() => {
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll('a[href]')) {
    const h = a.href, low = h.toLowerCase();
    if (!/download\.dws\.com|\.pdf(\?|$)/.test(low)) continue;
    if (/cookie|privacy|disclaimer|imprint|datenschutz|\/terms/.test(low)) continue;
    const t = (a.innerText || a.getAttribute('aria-label') || a.getAttribute('title') || '')
                .replace(/\s+/g, ' ').replace(/\b\d[\d.,]*\s?[KMG]B\b/ig, '').trim();
    if (seen.has(h)) continue; seen.add(h);
    const k = t.toLowerCase();
    const group = /interim|half.?year|quarter|\bq[1-4]\b/.test(k) ? 'Quarterly'
                : /annual|geschäftsbericht|gesch.ftsbericht/.test(k) ? 'Annual' : 'Reports';
    out.push({ url: h, label: (t || 'DWS document').slice(0, 90), group });
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="DWS",
    name="DWS Group",
    notes="group.dws.com IR — download.dws.com asset links (no .pdf ext) → DWS-specific extract; "
          "annual reports / quarterly results / presentations; bundled-browser download.",
    channel="chrome",
    pages=[
        PageSpec("https://group.dws.com/ir/reports-and-events/annual-report/",
                 group="Annual", extract=_DWS_PDF, settle=8000, scroll=10),
        PageSpec("https://group.dws.com/ir/reports-and-events/quarterly-results/",
                 group="Quarterly", extract=_DWS_PDF, settle=8000, scroll=10),
    ],
)
