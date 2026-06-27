"""Schroders (Schroders) — Competitor Data Scraper.

schroders.com corporate reporting hub serves annual report & accounts, half-year reports and
results presentations as direct .pdf / /-/media/ links — the generic EU_PDF extract handles the
labels, grouping (Annual/Quarterly/Reports) and the last-5-years filter. Bundled-browser download.
"""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import EU_PDF

SCRAPER = CompetitorDataScraper(
    code="Schroders",
    name="Schroders",
    notes="schroders.com reporting hub — annual/half-year reports + results presentations as "
          ".pdf / /-/media/ links; EU_PDF extract; last 5y.",
    channel="chrome",
    pages=[
        # The "reporting" root is a nav landing page (no PDFs); the results-and-presentations
        # sub-page renders the full archive — PDFs on the mybrand.schroders.com CDN (…/original/*.pdf).
        PageSpec("https://www.schroders.com/en/global/individual/corporate-transparency/reporting/corporate-results-reports-and-presentations/",
                 group="Annual", extract=EU_PDF, settle=9000, scroll=14),
    ],
)
