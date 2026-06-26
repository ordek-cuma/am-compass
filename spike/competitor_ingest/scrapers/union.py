"""Union Investment (Union) — Competitor Data Scraper.

Union Investment is a private cooperative KVG (DZ Bank group); its corporate reporting is
published for the legal parent Union Asset Management Holding AG on
unternehmen.union-investment.de as direct /dam/jcr:<uuid>/UMH_*.pdf links — the annual report
(Geschäftsbericht) and the sustainability report (Nachhaltigkeitsbericht). The listing is
JS-rendered and shows the current year prominently; the delta crawler accumulates older years
over time. Year + type from the link text / filename; last 5y; PDFs download via plain HTTP.
"""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import EU_PDF

_B = "https://unternehmen.union-investment.de/startseite-unternehmen/ueber-uns/geschaeftsbericht"

SCRAPER = CompetitorDataScraper(
    code="Union",
    name="Union Investment",
    notes="unternehmen.union-investment.de — Union Asset Management Holding AG Geschäftsbericht + "
          "Nachhaltigkeitsbericht (/dam/jcr PDFs); EU_PDF extract; last 5y; stdlib download.",
    channel="chrome",
    pages=[
        PageSpec(_B + ".html", group="Annual", extract=EU_PDF, settle=9000, scroll=8),
        PageSpec(_B + "/Berichte-vergangener-Jahre.html", group="Annual", extract=EU_PDF, settle=11000, scroll=10),
    ],
)
