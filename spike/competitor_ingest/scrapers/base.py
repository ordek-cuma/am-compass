"""Per-player Competitor Data Scraper types.

A CompetitorDataScraper describes how to harvest a competitor's firm-level document library
(annual/quarterly/proxy/SEC filings, etc.) from a JS-rendered site. One module per player
under this package (amundi.py, blackrock.py, …) defines a `SCRAPER` registered in
__init__.py. (Fund-level scrapers — e.g. an Amundi *Funds* scraper — are a separate concept
to be added later; this class is explicitly the company/"competitor data" one.)
"""
from __future__ import annotations
from dataclasses import asdict, dataclass, field
from typing import Callable


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
    click_each: str | None = None      # CSS for a set of filter BUTTONS to click one by one
                                       # (e.g. year tabs), harvesting after each — newest-first
    load_more: str | None = None       # CSS for a "load more" button to click until exhausted
    extract: str | None = None         # custom JS `() => [{url,label,group?}]` for rich labels
    exclude: str | None = None         # regex; drop docs whose label matches (e.g. ownership forms)
    follow: str | None = None          # regex; harvested links matching it are sub-pages to visit,
    follow_selector: str = "a[href$='.pdf']"  # …and harvest this selector's first PDF on each


@dataclass
class CompetitorDataScraper:
    code: str                          # competitor code (matches the web app)
    name: str
    pages: list[PageSpec] = field(default_factory=list)
    notes: str = ""                    # site quirks (cookie banner, DMS, bot-wall, …) for maintainers
    # Browser-download mode: for sites whose PDFs are bot-protected (e.g. Akamai) and only
    # reachable by a real in-session navigation. `resolve()` returns [{url,label,group}] (the
    # final PDF URLs), `warmup` is a page to load first to establish the session; the worker
    # downloads each via the browser instead of stdlib urllib.
    browser_download: bool = False
    warmup: str = ""
    resolve: Callable[[], list[dict]] | None = None
    channel: str = ""                  # browser channel for download mode (e.g. "chrome" when
                                       # bundled Chromium is HTTP/2-blocked)
    download_extract: str = ""         # JS `() => [{url,label,group}]` run on the warmed page to
                                       # discover the download targets in-session (no feed)
    download_via_browser: bool = False # discover targets normally (multi-page `pages`/`extract`)
                                       # but fetch each PDF through the browser, not stdlib — for
                                       # sites that render the listing fine yet 403 the PDF URLs
                                       # (Akamai on the asset CDN, e.g. allianz.com)

    def spec(self) -> dict:
        """JSON spec handed to render_worker (the Playwright subprocess)."""
        return {"pages": [asdict(p) for p in self.pages]}
