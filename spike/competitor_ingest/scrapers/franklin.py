"""Franklin Resources / Franklin Templeton (FT) — Competitor Data Scraper.

investors.franklinresources.com is q4cdn (BlackRock family) and friendly — loads with bundled
Chromium, PDFs download via plain HTTP. The financial-information page carries two widgets:
SEC filings (#SecYearSelect, BlackRock-style .module_item rows) and financial results
(#financial-year-select — earnings releases, investor presentations, named PDFs). Plus the
separate annual-report page for the glossy report. All capped to the last 5 years; ownership
forms (3/4/5/144) excluded.
"""
from .base import CompetitorDataScraper, PageSpec

_IR = "https://investors.franklinresources.com/investor-relations/financial-information/default.aspx"
_AR = "https://www.franklinresources.com/annual-report"

# SEC filings: scope to .module_item rows (skip the header), label by date + form, group by type.
# Whitelist the core corporate filings only — Franklin files a huge volume of fund filings
# (11-K, SC 13D, 40-6B, …) that are noise here; earnings 8-Ks are covered by the financial
# results widget.
_SEC_EXTRACT = r"""
() => {
  const KEEP = /\b(10-?K|10-?Q|DEF\s*14A|DEFA?\s*14A)\b/i;
  const out = [], seen = new Set();
  for (const item of document.querySelectorAll('.module_item')) {
    const date = (item.querySelector('.module-sec_date')?.innerText || '').trim();
    const typ  = (item.querySelector('.module-sec_filing')?.innerText || '').trim();
    if (!date || !/\d/.test(date) || !KEEP.test(typ)) continue;
    const group = /10-?K/i.test(typ) ? 'Annual' : /10-?Q/i.test(typ) ? 'Quarterly' : 'Proxy';
    for (const a of item.querySelectorAll("a[href*='cloudfront'], a[href$='.pdf']")) {
      if (!a.href || seen.has(a.href)) continue;
      seen.add(a.href);
      out.push({ url: a.href, label: (date + ' - ' + typ).replace(/\s+/g, ' ').trim().slice(0, 80), group });
    }
  }
  return out;
}
"""

# Financial results: named PDFs (earnings releases, investor presentations), last 5y.
_FIN_EXTRACT = r"""
() => {
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll("a[href$='.pdf']")) {
    const fn = (a.href.split('/').pop() || '');
    if (!/Earnings|Presentation|Press.?Release|Fact|Supplement|Highlights/i.test(fn)) continue;
    const ys = (fn.match(/20\d\d/g) || []).map(Number);
    if (ys.length && Math.max(...ys) < 2021) continue;
    if (seen.has(a.href)) continue;
    seen.add(a.href);
    const label = fn.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').replace(/\bFINAL\b/ig, '').replace(/\s+/g, ' ').trim();
    out.push({ url: a.href, label: label.slice(0, 80), group: 'Quarterly' });
  }
  return out;
}
"""

# Annual-report page: the glossy report + its Form 10-K link.
_AR_EXTRACT = r"""
() => {
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll("a[href$='.pdf']")) {
    const fn = (a.href.split('/').pop() || '');
    if (!/Annual-Report/i.test(fn)) continue;   // the glossy report only (10-K is in SEC)
    if (seen.has(a.href)) continue;
    seen.add(a.href);
    const label = fn.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    out.push({ url: a.href, label: label.slice(0, 80), group: 'Annual' });
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="FT",
    name="Franklin Resources",
    notes="q4cdn (BlackRock family); SEC filings (#SecYearSelect) + financial results "
          "(#financial-year-select) + annual-report page; stdlib download; last 5y.",
    pages=[
        PageSpec(_IR, group="Reports", iterate_select="#SecYearSelect", iterate_limit=5,
                 extract=_SEC_EXTRACT, exclude=r"\bForm (?:144|3|4|5)\b", settle=4000),
        PageSpec(_IR, group="Quarterly", iterate_select="#financial-year-select", iterate_limit=5,
                 extract=_FIN_EXTRACT, settle=4000),
        PageSpec(_AR, group="Annual", extract=_AR_EXTRACT, settle=5000),
    ],
)
