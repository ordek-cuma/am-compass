"""Capital Group (Capital Group) — Competitor Data Scraper.

Capital Group is privately held (The Capital Group Companies, Inc.) and files no corporate
annual report — so there is no IR results library. The reachable firm-level documents are its
**corporate-citizenship / sustainability / investment-stewardship** reports (PDFs on
capitalgroup.com). EU_PDF harvests those. (Fund-level American Funds filings live in SEC EDGAR
N-CSR — a separate fund-catalogue phase, not this company-level scraper.)
"""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import EU_PDF

SCRAPER = CompetitorDataScraper(
    code="Capital Group",
    name="Capital Group",
    notes="Private (no corporate annual report). Harvests citizenship/sustainability/stewardship "
          "report PDFs from capitalgroup.com; thin by design. Fund filings (N-CSR) are SEC, later phase.",
    channel="chrome",
    pages=[
        PageSpec("https://www.capitalgroup.com/individual/about-us/our-global-citizenship.html",
                 group="Reports", extract=EU_PDF, settle=7000, scroll=10),
        PageSpec("https://www.capitalgroup.com/advisor/investments/esg/perspectives/investment-stewardship.html",
                 group="Reports", extract=EU_PDF, settle=7000, scroll=10),
    ],
)
