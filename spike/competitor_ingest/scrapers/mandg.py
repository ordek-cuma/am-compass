"""M&G (MandG) — Competitor Data Scraper.

mandg.com / group.mandg.com investor centre serves the annual report & accounts, full/half-year
results and presentations as direct .pdf links (group.mandg.com/~/media/Files/…). EU_PDF handles
labels, Annual/Quarterly grouping and the last-5-years filter; bundled-browser download.
"""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import EU_PDF

SCRAPER = CompetitorDataScraper(
    code="MandG",
    name="M&G",
    notes="group.mandg.com investor results-and-announcements — annual report + FY/HY results "
          "PDFs; EU_PDF extract; last 5y.",
    channel="chrome",
    pages=[
        PageSpec("https://www.mandg.com/investor/results-and-reports",
                 group="Annual", extract=EU_PDF, settle=8000, scroll=12),
    ],
)
