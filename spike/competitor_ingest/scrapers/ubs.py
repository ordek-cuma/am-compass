"""UBS (UBS) — Competitor Data Scraper.

ubs.com investor-relations. Loads with the bundled browser; PDFs download via plain HTTP. UBS
is a foreign private issuer — its annual report is the SEC Form 20-F (filed for UBS Group AG
and UBS AG). Two pages: SEC filings (the 20-F annual reports) and quarterly reporting (the
latest results media release + results/fixed-income presentations + earnings-call remarks).
Labels come from the link text; year parsed from text/filename; last 5 years.
"""
from .base import CompetitorDataScraper, PageSpec

_B = "https://www.ubs.com/global/en/investor-relations/"

_EXTRACT = r"""
() => {
  const YEAR_MIN = 2021;
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll("a[href$='.pdf']")) {
    const href = a.href;
    const fn = decodeURIComponent(href.split('/').pop() || '');
    const t = (a.innerText || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    let y = null;
    let m = (t + ' ' + fn).match(/\b(20\d\d)\b/); if (m) y = +m[1];
    if (!y) { m = fn.match(/[1-4]q(\d{2})\b/i); if (m) y = 2000 + (+m[1]); }
    if (!y || y < YEAR_MIN) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    const k = (t + ' ' + fn).toLowerCase();
    const group = /20-?f|annual/.test(k) ? 'Annual'
                : /presentation|fixed.?income|call|remarks/.test(k) ? 'Reports'
                : /media release|results/.test(k) ? 'Earnings / Events' : 'Quarterly';
    const label = (t || fn.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim());
    out.push({ url: href, label: label.slice(0, 80) || 'Document', group });
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="UBS",
    name="UBS Asset Management",
    notes="ubs.com IR; bundled Chromium + stdlib download; SEC filings (20-F annual reports) "
          "+ quarterly reporting (latest results materials); last 5y.",
    pages=[
        PageSpec(_B + "financial-information/sec-filings.html", group="Annual", extract=_EXTRACT, settle=4000),
        PageSpec(_B + "financial-information/quarterly-reporting.html", group="Quarterly", extract=_EXTRACT, settle=4000),
    ],
)
