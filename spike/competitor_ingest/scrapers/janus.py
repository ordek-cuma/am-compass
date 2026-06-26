"""Janus Henderson (JH) — Competitor Data Scraper. Annual reports & proxy statements (q4cdn)."""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import NAMED_PDF

SCRAPER = CompetitorDataScraper(
    code="JH", name="Janus Henderson",
    notes="ir.janushenderson.com annual-reports; named PDFs, all years load by default; last 5y.",
    pages=[PageSpec("https://ir.janushenderson.com/financials/annual-reports/default.aspx",
                    group="Annual", extract=NAMED_PDF, settle=4000)],
)
