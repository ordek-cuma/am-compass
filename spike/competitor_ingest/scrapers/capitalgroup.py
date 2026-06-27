"""Capital Group (Capital Group) — Competitor Data Scraper.

Capital Group is privately held (The Capital Group Companies, Inc.) and files no corporate
annual report — so there is no IR results library. The reachable firm-level documents are its
**corporate-citizenship / sustainability / investment-stewardship** reports (PDFs on
capitalgroup.com). EU_PDF harvests those. (Fund-level American Funds filings live in SEC EDGAR
N-CSR — a separate fund-catalogue phase, not this company-level scraper.)
"""
from .base import CompetitorDataScraper, PageSpec

# Capital Group's corporate PDFs (citizenship/ESG/stewardship) often carry NO year in the link
# text, so the generic EU_PDF (which requires a year) drops them. This lenient extract grabs the
# few real corporate .pdf links and cleans Material-icon noise ("save_alt"). Excludes fund
# prospectuses/summary docs (those are the fund-catalogue phase, not company-level).
_CG_PDF = r"""
() => {
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll('a[href]')) {
    const h = a.href;
    if (!/\.pdf(\?|$)/i.test(h)) continue;
    if (/prospectus|summary-?prospectus|sai\b|statement-of-additional|cookie|privacy|disclaimer/i.test(h)) continue;
    if (seen.has(h)) continue; seen.add(h);
    let t = (a.innerText || a.getAttribute('aria-label') || a.getAttribute('title') || '')
              .replace(/\s+/g, ' ').replace(/save_alt|picture_as_pdf|file_download|download|\bPDF\b/ig, '')
              .replace(/\b\d[\d.,]*\s?[KMG]B\b/ig, '').replace(/\s+/g, ' ').trim();
    const k = t.toLowerCase();
    const group = /citizenship|sustainab|stewardship|esg|climate|proxy/.test(k) ? 'Reports' : 'Reports';
    out.push({ url: h, label: (t || 'Capital Group report').slice(0, 90), group });
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="Capital Group",
    name="Capital Group",
    notes="Private (no corporate annual report). Harvests citizenship/sustainability/stewardship "
          "report PDFs from capitalgroup.com via a lenient no-year extract; thin by design. Fund "
          "filings (N-CSR) are SEC, later phase.",
    channel="chrome",
    pages=[
        PageSpec("https://www.capitalgroup.com/individual/about-us/our-global-citizenship.html",
                 group="Reports", extract=_CG_PDF, settle=7000, scroll=10),
        PageSpec("https://www.capitalgroup.com/advisor/investments/esg/perspectives/investment-stewardship.html",
                 group="Reports", extract=_CG_PDF, settle=7000, scroll=10),
    ],
)
