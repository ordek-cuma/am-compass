"""Morgan Stanley (MS) — Competitor Data Scraper.

morganstanley.com/about-us-ir. Like T. Rowe, the bundled Chromium is HTTP/2-blocked → render
with real Chrome (channel). The IR docs live on four sub-pages (sec-filings, annual-reports,
earnings-releases, presentations) as content/dam PDFs that download via plain HTTP. Filenames
are date-coded (10q0326, 1q2026, 4Q25, 2025_Proxy_Statement); a shared extractor parses the
year, keeps the last 5, and groups by type.
"""
from .base import CompetitorDataScraper, PageSpec

_B = "https://www.morganstanley.com/about-us-ir/"

_EXTRACT = r"""
() => {
  const YEAR_MIN = 2021;
  const yearOf = (t, fn) => {
    const s = t + ' ' + fn;
    let m = t.match(/\d{1,2}\/\d{1,2}\/(\d{2})\b/); if (m) return 2000 + (+m[1]);   // MM/DD/YY label
    m = s.match(/\b(20\d\d)\b/); if (m) return +m[1];                                // YYYY
    m = s.match(/\b[1-4]q(\d{2})\b/i); if (m && +m[1] < 60) return 2000 + (+m[1]);   // 4Q25
    m = fn.match(/10[kq](\d{2})(\d{2})/i); if (m) return 2000 + (+m[2]);             // 10q0326 (MMYY)
    return null;
  };
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll("a[href*='.pdf']")) {
    const href = a.href;
    const fn = decodeURIComponent(href.split('/').pop() || '');
    const t = (a.innerText || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ')
                .replace(/\(opens? in (a )?new (tab|window)\)/ig, '').replace(/\s+/g, ' ').trim();
    const y = yearOf(t, fn);
    if (!y || y < YEAR_MIN) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    const k = (t + ' ' + fn).toLowerCase();
    const group = /10-?k\b/.test(k) ? 'Annual' : /10-?q\b/.test(k) ? 'Quarterly'
                : /proxy/.test(k) ? 'Proxy' : /annual.?report/.test(k) ? 'Annual'
                : /presentation|fixed.?income|strategic|investor day/.test(k) ? 'Reports'
                : 'Earnings / Events';
    let label = t;
    if (!t || t.length < 4 || /^pdf$/i.test(t) || /^20\d\d$/.test(t)) {
      label = fn.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    }
    out.push({ url: href, label: label.slice(0, 80) || 'Document', group });
  }
  return out;
}
"""


def _pg(path, group):
    return PageSpec(_B + path, group=group, extract=_EXTRACT, settle=4000, scroll=8)


SCRAPER = CompetitorDataScraper(
    code="MS",
    name="Morgan Stanley Investment Management",
    notes="IR HTTP/2-blocks bundled Chromium → real Chrome; 4 sub-pages; stdlib download; "
          "date-coded filenames; last 5y.",
    channel="chrome",
    pages=[
        _pg("sec-filings", "Reports"),
        _pg("annual-reports", "Proxy"),
        _pg("earnings-releases", "Earnings / Events"),
        _pg("presentations", "Reports"),
    ],
)
