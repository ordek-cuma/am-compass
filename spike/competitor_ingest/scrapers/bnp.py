"""BNP Paribas Asset Management (BNP) — Competitor Data Scraper.

BNP AM is a division of the BNP Paribas group; corporate documents come from the group IR site
invest.bnpparibas. The financial-reports search is server-rendered with ?page=N pagination;
each result card links to /en/document/<slug>, which is itself the DOWNLOAD endpoint — navigating
it streams the PDF (the visible /document/ SPA shell is incidental and does not render
headless). The asset host is WAF-protected against bare fetches, so PDFs download through the
in-session browser (download_via_browser). We keep the core corporate filings — Universal
Registration Document (the annual report) + amendments, annual financial report, integrated
report, half-year/results — and drop governance/remuneration noise. Last 5y.
"""
from .base import CompetitorDataScraper, PageSpec

_LIST = "https://invest.bnpparibas/en/search/reports/documents/financial-reports"

_EXTRACT = r"""
() => {
  const YEAR_MIN = 2021;
  const KEEP = /universal registration|registration document|annual report|annual financial|integrated report|half.?year|interim|\bresults\b|financial report|\burd\b|amendment to the (universal|2)/i;
  const DROP = /remuneration|compensation|mandataires|\bag du\b|code de commerce|voting rights|share buyback|liquidity|number of (voting|shares)|monthly|weekly|description of the|by-?laws|articles of|social report|csr report/i;
  const out = [], seen = new Set();
  for (const art of document.querySelectorAll("article.block-document, .block-document")) {
    const a = art.querySelector("a[href*='/document/']");
    if (!a) continue;
    const h = a.href;
    const title = (art.querySelector("h3, .title-5")?.innerText || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    const date = (art.querySelector(".document-date-1, [class*=date]")?.innerText || '').trim();
    const k = (title + ' ' + h).toLowerCase();
    if (DROP.test(k) || !KEEP.test(k)) continue;
    const m = (date + ' ' + title + ' ' + h).match(/(20[0-3]\d)/);
    const y = m ? +m[1] : null;
    if (!y || y < YEAR_MIN) continue;
    if (seen.has(h)) continue;
    seen.add(h);
    const group = /universal registration|registration document|annual|\burd\b/.test(k) ? 'Annual'
                : /half.?year|interim/.test(k) ? 'Quarterly'
                : /results/.test(k) ? 'Earnings / Events' : 'Reports';
    let label = (title && title.length > 3) ? title : decodeURIComponent(h.split('/').pop()).replace(/-/g, ' ');
    if (y && !label.includes(String(y))) label = label + ' ' + y;
    out.push({ url: h, label: label.slice(0, 90), group });
  }
  return out;
}
"""


def _pg(page):
    return PageSpec(f"{_LIST}?page={page}", group="Reports", extract=_EXTRACT, settle=7000, scroll=5)


SCRAPER = CompetitorDataScraper(
    code="BNP",
    name="BNP Paribas Asset Management",
    notes="invest.bnpparibas financial-reports (?page=N, server-rendered); each card → "
          "/en/document/<slug> which IS the PDF download endpoint. WAF-protected asset host → "
          "download_via_browser; keep URD/annual/integrated/results, drop governance noise; 5y.",
    channel="chrome",
    download_via_browser=True,
    warmup=f"{_LIST}?page=1",
    pages=[_pg(1), _pg(2), _pg(3)],
)
