"""WisdomTree (WisdomTree) — Competitor Data Scraper.

ir.wisdomtree.com/sec-filings/annual-reports — annual reports (ARS) + 10-K filings. Filenames
are either descriptive (wt…ars.pdf) or accession numbers (0001214659-26-…); the year is parsed
from a 4-digit year or the accession's -YY- segment. Last 5 years.
"""
from .base import CompetitorDataScraper, PageSpec

_EXTRACT = r"""
() => {
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll("a[href*='.pdf']")) {
    const fn = (a.href.split('/').pop() || '');
    if (seen.has(a.href)) continue;
    let y = null;
    let m = fn.match(/\b(20\d\d)\b/); if (m) y = +m[1];
    if (!y) { m = fn.match(/^\d{10}-(\d{2})-/); if (m) y = 2000 + (+m[1]); }
    if (y && y < 2021) continue;
    seen.add(a.href);
    const t = (a.innerText || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    const base = (t && t.length > 3) ? t : (/ars/i.test(fn) ? 'Annual Report (ARS)' : 'Annual filing');
    const label = (base + (y ? ' ' + y : '')).slice(0, 80);
    out.push({ url: a.href, label, group: 'Annual' });
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="WisdomTree", name="WisdomTree",
    notes="ir.wisdomtree.com annual-reports; ARS + 10-K PDFs; year from filename/accession; last 5y.",
    pages=[PageSpec("https://ir.wisdomtree.com/sec-filings/annual-reports", group="Annual", extract=_EXTRACT, settle=5000)],
)
