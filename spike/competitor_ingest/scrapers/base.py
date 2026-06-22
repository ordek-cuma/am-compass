"""Per-player Competitor Data Scraper types.

A CompetitorDataScraper describes how to harvest a competitor's firm-level document library
(annual/quarterly/proxy/SEC filings, etc.) from a JS-rendered site. One module per player
under this package (amundi.py, blackrock.py, …) defines a `SCRAPER` registered in
__init__.py. (Fund-level scrapers — e.g. an Amundi *Funds* scraper — are a separate concept
to be added later; this class is explicitly the company/"competitor data" one.)
"""
from __future__ import annotations
from dataclasses import asdict, dataclass, field


@dataclass
class PageSpec:
    url: str
    selector: str = "a[href]"          # CSS selector for document-download anchors (fallback harvest)
    label_attr: str = "aria-label"     # attribute holding the human title (falls back to title/text)
    group: str = "Reports"             # UI bucket: Annual | Quarterly | Reports | …
    scroll: int = 8                    # lazy-load scroll passes (when not iterating a dropdown)
    settle: int = 4000                 # ms to wait after load / each dropdown change
    iterate_select: str | None = None  # CSS for a <select> whose options to iterate (e.g. a year filter)
    iterate_limit: int | None = None   # cap on how many options to iterate (e.g. 5 = last 5 years)
    extract: str | None = None         # custom JS `() => [{url,label}]` for rich per-row labels
    exclude: str | None = None         # regex; drop docs whose label matches (e.g. ownership forms)


@dataclass
class CompetitorDataScraper:
    code: str                          # competitor code (matches the web app)
    name: str
    pages: list[PageSpec] = field(default_factory=list)
    notes: str = ""                    # site quirks (cookie banner, DMS, bot-wall, …) for maintainers

    def spec(self) -> dict:
        """JSON spec handed to render_worker (the Playwright subprocess)."""
        return {"pages": [asdict(p) for p in self.pages]}
