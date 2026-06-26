"""Blackstone (Blackstone) — Competitor Data Scraper.

ir.blackstone.com/sec-filings — q4cdn, the same widget as BlackRock: filings filtered by
#SecYearSelect, each a .module_item with date + form type and PDF/Excel/HTML download icons.
Take only the PDF (and Excel) icon, iterate the last 5 years, exclude ownership forms.
"""
from .base import CompetitorDataScraper, PageSpec

# Whitelist the core corporate filings — Blackstone files a huge volume of ownership (Form
# 3/4/5/144) and institutional-holdings (13F/13G/13D) filings that are noise here. Form names
# may have no space ("Form10-Q"), so don't anchor the number on a word boundary.
_EXTRACT = r"""
() => {
  const KEEP = /(10-?K|10-?Q|8-?K|DEF\s*14A|DEFA\s*14A|S-\d|424B|ARS)/i;
  const out = [], seen = new Set();
  for (const item of document.querySelectorAll('.module_item')) {
    const date = (item.querySelector('.module-sec_date')?.innerText || '').trim();
    const typ  = (item.querySelector('.module-sec_filing')?.innerText || '').trim();
    if (!date || !KEEP.test(typ)) continue;
    const label = (date + ' - ' + typ).replace(/\s+/g, ' ').trim().slice(0, 90);
    const group = /10-?K/i.test(typ) ? 'Annual' : /10-?Q/i.test(typ) ? 'Quarterly'
                : /8-?K/i.test(typ) ? 'Earnings / Events' : /14A|proxy/i.test(typ) ? 'Proxy' : 'Reports';
    for (const a of item.querySelectorAll('a[href]')) {     // PDF + Excel only (drop .html/.zip variants)
      const low = a.href.toLowerCase().split('?')[0];
      if (!/\.pdf$|\.xlsx?$/.test(low) || seen.has(a.href)) continue;
      seen.add(a.href);
      out.push({ url: a.href, label, group });
    }
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="Blackstone",
    name="Blackstone",
    notes="q4cdn SEC-filings (BlackRock widget); iterate #SecYearSelect; per-row PDF/Excel "
          "icon; last 5y; excludes ownership forms.",
    pages=[
        PageSpec(
            url="https://ir.blackstone.com/sec-filings/default.aspx",
            group="Reports",
            iterate_select="#SecYearSelect",
            iterate_limit=5,
            extract=_EXTRACT,
            exclude=r"\bForm (?:144|3|4|5)\b",
            settle=4500,
        ),
    ],
)
