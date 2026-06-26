"""Fidelity (Fidelity) — Competitor Data Scraper.

Fidelity is private; its firm-level docs live on about.fidelity.com/data-and-insights, a Wix
site with three sections — Annual reports, Business updates, Retirement analysis — by year /
quarter. Two-level: older items link straight to a PDF (_files/ugd/…pdf); newer items link to
a sub-page (/data-and-insights/<slug>) that holds the PDF.

  - Annual reports + Business updates → PDFs (direct or one click deep, followed).
  - Retirement analysis → on-page HTML/interactive, NO downloadable PDF → skipped.

The extractor labels each item by section + period; `follow` visits annual-report /
business-update sub-pages and grabs the document PDF.
"""
from .base import CompetitorDataScraper, PageSpec

_EXTRACT = r"""
() => {
  const section = h => /annual-report/i.test(h) ? ['Annual Report','Annual']
                     : /business-update/i.test(h) ? ['Business Update','Quarterly']
                     : /retirement-analysis/i.test(h) ? ['Retirement Analysis','Reports']
                     : ['',''];
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll('a')) {
    const t = (a.innerText || '').trim();
    const h = a.href || '';
    if (!/^(Q[1-4] )?20\d\d$|annual report/i.test(t)) continue;
    if (!h || seen.has(h)) continue;
    seen.add(h);
    const [sname, grp] = section(h);
    let label = t, group = grp || 'Reports';
    if (sname) { label = /annual report/i.test(t) ? t : (t + ' ' + sname); }
    else if (/^Q[1-4] 20\d\d$/i.test(t)) { label = t + ' Business Update'; group = 'Quarterly'; }
    else if (/^20\d\d$/.test(t)) { label = t + ' Annual Report'; group = 'Annual'; }
    out.push({ url: h, label, group });
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="Fidelity",
    name="Fidelity Investments",
    notes="Wix site; 3 sections by year/quarter; two-level (sub-pages hold the PDF). "
          "Retirement analysis is HTML-only (no PDF) → skipped.",
    pages=[
        PageSpec(
            url="https://about.fidelity.com/data-and-insights",
            group="Reports",
            extract=_EXTRACT,
            follow=r"data-and-insights/[^/]*(annual-report|business-update)",
            follow_selector="a[href*='/_files/ugd/']",
            settle=4000,
        ),
    ],
)
