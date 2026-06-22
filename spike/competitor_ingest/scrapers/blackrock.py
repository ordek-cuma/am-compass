"""BlackRock (BL) — Competitor Data Scraper.

IR SEC-filings page (q4cdn). Quirks:
  - Cloudflare *managed* challenge: clears on its own with a realistic browser profile
    (render_worker sets a real UA / viewport / launch args); we do not solve a challenge.
  - Filings are filtered by a year <select> (#SecYearSelect, 2026…2019) — iterate every year.
  - Each filing is a `.module_item`; the PDF link is a download icon (generic aria-label), so
    a custom extractor climbs to the item and reads its date + form type for the label.
  - PDFs are hosted on Cloudfront (no extension). Ownership forms (3/4/5/144 — insider-trade
    noise) are excluded; everything else (10-K, 10-Q, 8-K, DEF 14A, S-*, …) is kept.
"""
from .base import CompetitorDataScraper, PageSpec

# Per filing item, take only the PDF (and Excel, if present) download icon — never the HTML
# version — and label it with the filing's date + form type.
_EXTRACT = r"""
() => {
  const out = [], seen = new Set();
  for (const item of document.querySelectorAll('.module_item')) {
    const date = (item.querySelector('.module-sec_date')?.innerText || '').trim();
    const typ  = (item.querySelector('.module-sec_filing')?.innerText || '').trim();
    if (!date) continue;
    const label = (date + ' - ' + typ).replace(/\s+/g, ' ').trim().slice(0, 90);
    for (const li of item.querySelectorAll('li.module-sec_pdf, li[class*=xls], li[class*=excel]')) {
      const a = li.querySelector('a[href]');
      if (!a || !a.href || seen.has(a.href)) continue;
      seen.add(a.href);
      out.push({ url: a.href, label });
    }
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="BL",
    name="BlackRock",
    notes="q4cdn SEC-filings page; Cloudflare managed challenge clears with a real browser "
          "profile; iterate #SecYearSelect; per-row extractor; excludes ownership forms.",
    pages=[
        PageSpec(
            url="https://ir.blackrock.com/financials/sec-filings/default.aspx",
            group="Reports",
            iterate_select="#SecYearSelect",
            iterate_limit=5,  # last 5 years, not the whole history
            extract=_EXTRACT,
            exclude=r"\bForm (?:144|3|4|5)\b",
            settle=4500,
        ),
    ],
)
