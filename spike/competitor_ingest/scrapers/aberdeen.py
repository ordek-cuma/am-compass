"""Aberdeen Group / abrdn (abrdn) — Competitor Data Scraper.

aberdeeninvestments.com results-reports-and-presentations hub serves annual report & accounts,
full/half-year results and presentations as .pdf / docs?documentid= links — EU_PDF handles the
labels and grouping. (Firm renamed abrdn → Aberdeen Group plc in 2025; LSE ticker still ABDN.)
"""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import EU_PDF

SCRAPER = CompetitorDataScraper(
    code="abrdn",
    name="Aberdeen Group (abrdn)",
    notes="aberdeeninvestments.com results-reports-and-presentations — annual/half-year results "
          "+ presentations; EU_PDF extract; last 5y; renamed abrdn → Aberdeen Group 2025.",
    channel="chrome",
    pages=[
        PageSpec("https://www.aberdeeninvestments.com/en-gb/institutional/insights-and-research/results-reports-and-presentations",
                 group="Annual", extract=EU_PDF, settle=8000, scroll=12),
    ],
)
