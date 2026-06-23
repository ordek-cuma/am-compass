"""Vanguard (Vanguard) — Competitor Data Scraper.

Vanguard is private (no SEC financials); its public firm-level documents are Investment
Stewardship / proxy-voting reports. The archived-reports page lists them as PDFs (annual
stewardship report, quarterly engagement reports, regional briefs, vote-rationale case
studies). Each report has both a titled link and a generic "Open PDF" link to the same file,
so the extractor dedupes by href and prefers the real title.

A "Load more" button is wired (load_more) for depth; note it fires only analytics in a
headless context, so today this yields the currently-featured set (~33). More history lives
on other Vanguard pages — see notes / the URLs offered to the user.
"""
from .base import CompetitorDataScraper, PageSpec

# Dedupe pdf links by href; prefer the titled link over the generic "Open PDF".
_EXTRACT = r"""
() => {
  const m = {};
  for (const e of document.querySelectorAll("a[href*='.pdf']")) {
    const h = e.href;
    const t = (e.innerText || e.getAttribute('aria-label') || '').trim();
    if (!m[h] || (/open pdf/i.test(m[h]) && !/open pdf/i.test(t))) m[h] = t;
  }
  return Object.entries(m).map(([url, label]) => ({ url, label }));
}
"""

SCRAPER = CompetitorDataScraper(
    code="Vanguard",
    name="Vanguard",
    notes="Investment Stewardship / proxy-voting PDFs; titled + 'Open PDF' dup links; "
          "'Load more' fires analytics only in headless → currently-featured set.",
    pages=[
        PageSpec(
            url="https://corporate.vanguard.com/content/corporatesite/us/en/corp/about-our-funds/proxy-voting-across-funds/archived-reports.html",
            selector="a[href*='.pdf']",
            group="Reports",
            extract=_EXTRACT,
            load_more="a:has-text('Load more')",
            settle=4000,
        ),
    ],
)
