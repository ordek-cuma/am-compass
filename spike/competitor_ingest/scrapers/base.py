"""Per-player site-scraper types.

A Scraper describes how to harvest a competitor's JS-rendered document library: which
page(s) to render and the CSS selector for the download anchors. One module per player under
this package (e.g. amundi.py) defines a `SCRAPER` and is registered in __init__.py.
"""
from __future__ import annotations
from dataclasses import asdict, dataclass, field


@dataclass
class PageSpec:
    url: str
    selector: str                 # CSS selector for the document-download anchors
    label_attr: str = "aria-label"  # attribute holding the human title (falls back to title/text)
    group: str = "Reports"        # UI bucket: Annual | Quarterly | Reports | …
    scroll: int = 12              # lazy-load scroll passes


@dataclass
class Scraper:
    code: str                     # competitor code (matches the web app)
    name: str
    pages: list[PageSpec] = field(default_factory=list)
    notes: str = ""               # site quirks (cookie banner, DMS, etc.) for whoever maintains it

    def spec(self) -> dict:
        """JSON spec handed to render_worker (the Playwright subprocess)."""
        return {"pages": [asdict(p) for p in self.pages]}
