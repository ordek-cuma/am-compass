"""T. Rowe Price (TROW) — Competitor Data Scraper (browser-download, real Chrome).

investors.troweprice.com is the hardest of the q4-style IR sites:
  - The bundled Chromium gets HTTP/2-rejected (Akamai); the page loads only with real Chrome
    (channel="chrome").
  - Documents are /static-files/<uuid> URLs (no .pdf extension) behind Akamai; they're served
    INLINE (application/pdf), so navigating with wait_until="commit" yields the PDF directly —
    captured via the worker's _grab.

The page lists Annual Reports + Proxy Statements + Annual Meeting Notices by year (2011→).
Discovery runs in-session (download_extract) since there's no feed: each /static-files link is
labelled with its year-section heading; capped to the last 5 years.
"""
from .base import CompetitorDataScraper

# Each document group is an <article class="…nir-asset…"> whose text carries the year context
# (e.g. "2025 Annual Report Proxy Statement"); the /static-files links live inside it. Scope to
# those articles (skips nav links), label by the link text (fall back to the article title for
# the icon-only annual-report link), prefer the text link over the empty thumbnail dup.
_EXTRACT = r"""
() => {
  const YEAR_MIN = 2021;
  const m = {};
  for (const art of document.querySelectorAll('article[class*="nir-asset"]')) {
    const title = (art.innerText || '').replace(/\s+/g, ' ').trim();
    const ym = (title.match(/20\d\d/) || [])[0];
    if (!ym || +ym < YEAR_MIN) continue;
    for (const a of art.querySelectorAll('a[href*="/static-files/"]')) {
      const txt = (a.innerText || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      const good = txt && txt.length > 2;
      const label = (good ? (/20\d\d/.test(txt) ? txt : ym + ' ' + txt) : title).slice(0, 80);
      const group = /proxy|meeting notice|notice/i.test(label) ? 'Proxy'
                  : /annual report/i.test(label) ? 'Annual' : 'Reports';
      if (!m[a.href] || (good && m[a.href].weak)) m[a.href] = { label, group, weak: !good };
    }
  }
  return Object.entries(m).map(([url, v]) => ({ url, label: v.label, group: v.group }));
}
"""

SCRAPER = CompetitorDataScraper(
    code="TROW",
    name="T. Rowe Price",
    notes="Akamai HTTP/2-blocks bundled Chromium → real Chrome channel; /static-files served "
          "inline (grab response body); in-session discovery, year-context labels, last 5y.",
    browser_download=True,
    warmup="https://investors.troweprice.com/financials/annual-reports-proxy-statements",
    channel="chrome",
    download_extract=_EXTRACT,
)
