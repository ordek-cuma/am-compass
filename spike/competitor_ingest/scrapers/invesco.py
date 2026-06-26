"""Invesco (IVZ) — Competitor Data Scraper. Annual reports & proxy statements as named PDFs."""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import NAMED_PDF

SCRAPER = CompetitorDataScraper(
    code="IVZ", name="Invesco",
    notes="invesco.com annual-reports-and-proxy-statements; named PDFs (annual report + proxy); last 5y.",
    pages=[PageSpec("https://www.invesco.com/corporate/en/investor-relations/annual-reports-and-proxy-statements.html",
                    group="Annual", extract=NAMED_PDF, settle=4000)],
)
