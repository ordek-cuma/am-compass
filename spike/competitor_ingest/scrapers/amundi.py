"""Amundi (AMU) — JS document library.

Docs are served from a Nuxeo DMS as /files/nuxeo/dl/<uuid> anchors with NO .pdf extension
and the English title in aria-label. The whole set loads at once (year/quarter tabs only
filter the view) once the cookie banner is dismissed (handled generically in render_worker).
The English site (about.amundi.com) is used for English titles; the French
legroupe.amundi.com mirror carries the same documents.
"""
from .base import PageSpec, Scraper

SCRAPER = Scraper(
    code="AMU",
    name="Amundi",
    notes="Nuxeo DMS anchors (no .pdf ext); cookie banner; full set loads at once.",
    pages=[
        PageSpec("https://about.amundi.com/financial-results",
                 "a[href*='/files/nuxeo/dl/']", group="Reports"),
        PageSpec("https://about.amundi.com/legal-documentation",
                 "a[href*='/files/nuxeo/dl/']", group="Annual"),
    ],
)
