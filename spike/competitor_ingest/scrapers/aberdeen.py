"""Aberdeen Group / abrdn (abrdn) — Competitor Data Scraper.

IR moved to aberdeenplc.com; the financial-library-and-results page lists reports/results as
`docs?documentId=…` / `docs?editionId=…` redirector links (NOT .pdf), so a custom extract catches
those. (Firm renamed abrdn → Aberdeen Group plc in 2025; LSE ticker still ABDN.)
"""
from .base import CompetitorDataScraper, PageSpec

_ABRDN_PDF = r"""
() => {
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll('a[href]')) {
    const h = a.href, low = h.toLowerCase();
    if (!/\/docs\?\w*(documentid|editionid)=|\.pdf(\?|$)/.test(low)) continue;
    if (/cookie|privacy|disclaimer|\/terms/.test(low)) continue;
    if (seen.has(h)) continue; seen.add(h);
    const t = (a.innerText || a.getAttribute('aria-label') || a.getAttribute('title') || '')
                .replace(/\s+/g, ' ').replace(/\b\d[\d.,]*\s?[KMG]B\b/ig, '').trim();
    const k = t.toLowerCase();
    const group = /interim|half.?year|quarter|\bq[1-4]\b/.test(k) ? 'Quarterly'
                : /annual.?report|annual report and accounts/.test(k) ? 'Annual' : 'Reports';
    out.push({ url: h, label: (t || 'Aberdeen document').slice(0, 90), group });
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="abrdn",
    name="Aberdeen Group (abrdn)",
    notes="aberdeenplc.com financial-library-and-results — docs?documentId=/editionId= redirector "
          "links (not .pdf) → custom extract; renamed abrdn → Aberdeen Group 2025.",
    channel="chrome",
    pages=[
        PageSpec("https://www.aberdeenplc.com/en-gb/investors/financial-library-and-results",
                 group="Annual", extract=_ABRDN_PDF, settle=9000, scroll=12),
    ],
)
