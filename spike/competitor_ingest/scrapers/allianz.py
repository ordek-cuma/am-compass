"""Allianz Global Investors (AGI) — Competitor Data Scraper.

AllianzGI is consolidated into Allianz Group, so the corporate documents come from the Allianz
Group IR site (allianz.com/.../results-reports). All five user-supplied pages serve direct .pdf
links: the group/SE annual reports (current + archive), the half-year interim reports, the
own-funds reports and the SFCR (Solvency & Financial Condition Reports). Year + type from the
link text / filename; last 5y; PDFs download via plain HTTP.
"""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import EU_PDF

_B = "https://www.allianz.com/en/investor_relations/results-reports/"


def _pg(path, group):
    return PageSpec(_B + path, group=group, extract=EU_PDF, settle=8000, scroll=8)


SCRAPER = CompetitorDataScraper(
    code="AGI",
    name="Allianz Global Investors",
    notes="Allianz Group IR (allianz.com) — annual reports + archive + interim + own-funds + "
          "SFCR; direct .pdf links, EU_PDF extract; last 5y. The asset CDN 403s stdlib fetches "
          "(Akamai) so PDFs download via the browser (download_via_browser).",
    channel="chrome",
    download_via_browser=True,
    pages=[
        _pg("annual-reports.html", "Annual"),
        _pg("annual-reports/annual-report-archive.html", "Annual"),
        _pg("interim-reports.html", "Quarterly"),
        _pg("own-funds-report.html", "Reports"),
        _pg("sfcr.html", "Reports"),
    ],
)
