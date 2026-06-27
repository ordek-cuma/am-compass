"""BayernInvest (Bayern Invest) — Competitor Data Scraper, via parent BayernLB.

BayernInvest is a German KVG (BayernLB subsidiary) that publishes no corporate financials of
its own; the consolidated reporting comes from the parent BayernLB IR site. The financial-reports
page serves direct .pdf links: the Annual Report (Konzernabschluss), Group Half-Yearly Financial
Report and the Disclosure (Pillar 3) reports. Year + type from the link text / filename; last 5y;
PDFs download via plain HTTP.
"""
from .base import CompetitorDataScraper, PageSpec
from ._extracts import EU_PDF

SCRAPER = CompetitorDataScraper(
    code="Bayern Invest",
    name="BayernInvest (via BayernLB)",
    notes="parent BayernLB IR financial_reports.jsp — Konzernabschluss (annual) + half-yearly + "
          "disclosure PDFs; EU_PDF extract; last 5y; stdlib download.",
    channel="chrome",
    pages=[PageSpec(
        "https://www.bayernlb.com/internet/en/blb/resp/meta_6/about_us/investor_relations_7/"
        "veroeffentlichungen_1/finanzberichte_1/financial_reports.jsp",
        group="Reports", extract=EU_PDF, settle=8000, scroll=8)],
)
