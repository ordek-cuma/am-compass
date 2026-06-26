"""DekaBank (DEKA) — Competitor Data Scraper.

deka.de/.../reports-and-presentations is a rich IR page of direct .pdf links: Deka Group annual
& interim reports, annual financial statements, quarterly disclosure (Pillar 3) reports and the
business-development presentations. Labels carry the type + date (and a KB size, stripped). Year
from text/filename; last 5y; PDFs download via plain HTTP.
"""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import EU_PDF

SCRAPER = CompetitorDataScraper(
    code="DEKA",
    name="DekaBank (Deka)",
    notes="deka.de reports-and-presentations — annual/interim/financial-statements/disclosure/"
          "presentation PDFs; EU_PDF extract; last 5y; stdlib download.",
    channel="chrome",
    pages=[PageSpec("https://www.deka.de/deka-group/investor-relations-en/reports-and-presentations",
                    group="Reports", extract=EU_PDF, settle=8000, scroll=10)],
)
