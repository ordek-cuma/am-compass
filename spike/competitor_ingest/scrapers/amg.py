"""Affiliated Managers Group (AMG) — Competitor Data Scraper. Annual reports (cloudfront,
year in the link text); bundled Chromium is HTTP/2-blocked → real Chrome."""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import NAMED_PDF

SCRAPER = CompetitorDataScraper(
    code="AMG", name="Affiliated Managers Group",
    notes="ir.amg.com/annual-reports; cloudfront PDFs, year in link text; real Chrome; last 5y.",
    channel="chrome",
    pages=[PageSpec("https://ir.amg.com/annual-reports", group="Annual", extract=NAMED_PDF, settle=4000)],
)
