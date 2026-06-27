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
        # IR lives on group.mandg.com; /~/media/*.pdf hrefs (EU_PDF matches the .pdf). latest-results
        # = current FY/HY decks + transcripts; annual-report = the ARA PDF.
        PageSpec("https://group.mandg.com/investors/results-and-announcements/latest-results",
                 group="Quarterly", extract=EU_PDF, settle=9000, scroll=12),
        PageSpec("https://group.mandg.com/investors/results-and-announcements/annual-report",
                 group="Annual", extract=EU_PDF, settle=9000, scroll=12),
    ],
)
