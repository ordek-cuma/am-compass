"""JPMorgan (JPM) — Competitor Data Scraper.

jpmorganchase.com/ir/annual-report. The whole "Reports by year" history (2009→present) is
rendered on one page as direct PDFs — Annual Report, Proxy Statement, Chairman & CEO letter,
line-of-business CEO letters, financial highlights, MD&A, audited financial statements, etc.
Capped to the last 5 years. Link text is mostly generic ("View Document"), so labels are
derived from the descriptive filenames; documents are required to carry a year (drops undated
nav/footer PDFs).
"""
from .base import CompetitorDataScraper, PageSpec

# Keep PDFs whose filename year is >= 2021 (last 5y); label from link text when descriptive,
# else from the filename; group by document type.
_EXTRACT = r"""
() => {
  const YEAR_MIN = 2021;
  const titleCase = s => s.replace(/[-_]+/g,' ').replace(/(\d{4})/,' $1').replace(/\s+/g,' ')
                          .trim().replace(/\b\w/g, c => c.toUpperCase())
                          .replace(/\bAnnualreport\b/i,'Annual Report').replace(/\bCeo\b/g,'CEO')
                          .replace(/\bMd A\b/i,"Management's Discussion & Analysis");
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll("a[href*='.pdf']")) {
    const h = a.href; if (!h || seen.has(h)) continue; seen.add(h);
    const fn = (h.split('/').pop() || '').toLowerCase();
    const ys = (fn.match(/20\d\d/g) || []).map(Number);
    if (!ys.length || Math.max(...ys) < YEAR_MIN) continue;   // require a year, last 5y only
    let t = (a.innerText || '').trim();
    if (!t || /^(view document|view|open|read|download|learn more)\b/i.test(t)) t = titleCase(fn.replace(/\.pdf.*$/,''));
    let group = 'Reports';
    if (/annualreport|annual-report/.test(fn)) group = 'Annual';
    else if (/proxy/.test(fn)) group = 'Proxy';
    else if (/letter/.test(fn)) group = 'Letters';
    out.push({ url: h, label: t.slice(0, 90), group });
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="JPM",
    name="JPMorgan Chase",
    notes="IR annual-report page; full year history on one page as direct PDFs; capped to "
          "last 5y; labels derived from filenames (link text is generic 'View Document').",
    pages=[
        PageSpec(
            url="https://www.jpmorganchase.com/ir/annual-report",
            group="Reports",
            extract=_EXTRACT,
            settle=4000,
            scroll=10,
        ),
    ],
)
