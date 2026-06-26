"""PGIM / Prudential (PGIM) — Competitor Data Scraper. Proxy, annual report, voting results."""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import NAMED_PDF

SCRAPER = CompetitorDataScraper(
    code="PGIM", name="PGIM (Prudential)",
    notes="investor.prudential.com proxy/annual-report/voting-results; named PDFs; last 5y.",
    pages=[PageSpec("https://investor.prudential.com/financials/proxy-statement-annual-report-and-voting-results/default.aspx",
                    group="Annual", extract=NAMED_PDF, settle=11000)],
)
