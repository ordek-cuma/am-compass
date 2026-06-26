"""AllianceBernstein (AB) — Competitor Data Scraper.

The reports.html page embeds a gcs-web IR site; the real documents live on
alliancebernsteinholdinglp.gcs-web.com as /static-files/<uuid> links (NOT cloudfront — that
was the earlier miss) and download via plain HTTP. The clean source is the quarterly-results
page: 10-K / 10-Q / Annual Report / earnings releases & presentations / corporate fact sheets
as PDFs, plus the GAAP-reconciliation Excel files. (The site's two SEC-filing lists were
dropped — they served XBRL/XML index pages, not real PDFs, and just duplicated EDGAR.) Needs
real Chrome (the page is HTTP/2-touchy in the bundled browser). Year from the label/accordion;
last 5y. UUID URLs are stable → idempotent re-runs.
"""
from .base import CompetitorDataScraper, PageSpec

_B = "https://alliancebernsteinholdinglp.gcs-web.com/"

_EXTRACT = r"""
() => {
  const YEAR_MIN = 2021;
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll("a[href*='/static-files/']")) {
    if (seen.has(a.href)) continue;
    const t = (a.innerText || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    if (/\.(xls|xlsx|rtf|txt)$/i.test(t)) continue;   // SEC pages: keep the PDF variant only
    let y = null, m;
    if ((m = t.match(/(20\d\d)/))) y = +m[1];
    else if ((m = t.match(/^\d{10}-(\d{2})-/))) y = 2000 + (+m[1]);   // accession -YY-
    else { let r = a; for (let i = 0; i < 8; i++) { if (!r.parentElement) break; r = r.parentElement;
             const mm = (r.innerText || '').match(/\b(20\d\d)\b/); if (mm) { y = +mm[1]; break; } } }
    if (y && y < YEAR_MIN) continue;
    seen.add(a.href);
    const isAcc = /^\d{10}-\d{2}-\d+/.test(t);
    let label = isAcc ? ('SEC Filing ' + (y || '')) : (y && !t.includes(String(y)) ? t + ' ' + y : t);
    const k = t.toLowerCase();
    const group = /10-?q/.test(k) ? 'Quarterly' : /10-?k|annual/.test(k) ? 'Annual'
                : /proxy|14a/.test(k) ? 'Proxy' : /presentation|fact.?sheet|slides/.test(k) ? 'Reports'
                : /press release|earnings|8-?k/.test(k) ? 'Earnings / Events' : 'Reports';
    out.push({ url: a.href, label: (label || 'Document').slice(0, 80), group });
  }
  return out;
}
"""


def _pg(path, group):
    return PageSpec(_B + path, group=group, extract=_EXTRACT, settle=9000, scroll=10)


SCRAPER = CompetitorDataScraper(
    code="AB",
    name="AllianceBernstein",
    notes="gcs-web /static-files PDFs + GAAP-reconciliation Excel (real Chrome, stdlib download); "
          "quarterly-results page; last 5y.",
    channel="chrome",
    pages=[
        _pg("financial-information/quarterly-results", "Earnings / Events"),
    ],
)
