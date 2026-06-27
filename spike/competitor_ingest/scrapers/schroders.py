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
        PageSpec("https://www.schroders.com/en/global/individual/corporate-transparency/reporting/",
                 group="Annual", extract=EU_PDF, settle=8000, scroll=12),
    ],
)
