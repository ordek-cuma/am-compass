"""Swiss Life (Swiss Life AM) — Competitor Data Scraper.

swisslife.com/en/home/investors/results-and-reports.html. Loads with the bundled browser; the
documents (results media releases, half-year/annual reports, presentations, conference-call
material) are filtered by year via JS BUTTON tabs (not a dropdown) — handled with click_each.
Multiple language variants per doc (de/fr/it/en) → keep English only. Last 5 years.
"""
from .base import CompetitorDataScraper, PageSpec

# PDFs only (drop the .html nav links), English only (skip _de/_fr/_it + German "Medienmitteilung").
_EXTRACT = r"""
() => {
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll("a[href*='.pdf']")) {
    const href = a.href;
    const fn = decodeURIComponent(href.split('/').pop() || '');
    if (/_de\.pdf|_fr\.pdf|_it\.pdf|medienmitteilung|communiqu|conferenza/i.test(fn)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    let label = fn.replace(/\.pdf$/i, '').replace(/%20|_/g, ' ').replace(/\bSwiss Life( Group)?\b/i, '')
                  .replace(/\ben\b\s*$/i, '').replace(/\s+/g, ' ').trim();
    const group = /half.?year|\bhy\d|\b9m|\bq[1-4]|\b3m|interim/i.test(fn) ? 'Quarterly'
                : /annual.?report|geschaeft|\bgb\d|\bar\d/i.test(fn) ? 'Annual'
                : /presentation|conference|call|webcast|slides/i.test(fn) ? 'Reports'
                : 'Earnings / Events';
    out.push({ url: href, label: (label || 'Document').slice(0, 80), group });
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="Swiss Life AM",
    name="Swiss Life Asset Managers",
    notes="results-and-reports; year filter is JS button tabs (click_each, last 5y); keep EN "
          "language variant; results media releases + reports + presentations.",
    pages=[
        PageSpec(
            url="https://www.swisslife.com/en/home/investors/results-and-reports.html",
            group="Earnings / Events",
            extract=_EXTRACT,
            click_each="button.m-list-filter__filter-button",
            iterate_limit=5,
            settle=3000,
        ),
    ],
)
