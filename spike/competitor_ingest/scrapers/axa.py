"""AXA IM Alts (AXA IM Alts.) — Competitor Data Scraper, via parent AXA group.

AXA IM Alts is the alternatives arm of AXA; its corporate reporting comes from the AXA group
investor site. The annual-and-interim-reports page serves direct .pdf links — the Annual Report
(Universal Registration Document), the Half-Year Financial Report and the Integrated Report.
The page lists the current year only (no archive/year tabs), so the delta crawler accumulates
new years over time. Year + type from the link text / filename; last 5y; PDFs download via
plain HTTP.
"""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import EU_PDF

SCRAPER = CompetitorDataScraper(
    code="AXA IM Alts.",
    name="AXA IM Alts",
    notes="parent AXA group IR (axa.com/en/investor/annual-and-interim-reports) — annual "
          "report/URD + half-year + integrated report PDFs; EU_PDF extract; current year only "
          "(no archive); last 5y; stdlib download.",
    channel="chrome",
    pages=[PageSpec("https://www.axa.com/en/investor/annual-and-interim-reports",
                    group="Annual", extract=EU_PDF, settle=8000, scroll=8)],
)
