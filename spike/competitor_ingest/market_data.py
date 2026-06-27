"""Market-data connector — live market cap for the publicly-traded managers, no API key.

Market cap is not in annual reports (it's a market figure), so the Capital tab used hand-entered,
dated values. This connector recomputes it on every crawl from two free sources:
  • share price — Yahoo Finance chart API (keyless JSON), and
  • shares outstanding — SEC XBRL `dei:EntityCommonStockSharesOutstanding` (the same companyfacts
    we already pull for each US filer).
market_cap = price × shares. Tagged basis="external", vendor="market-data". On any fetch failure
it returns nothing and the hand-verified overlay value remains as the fallback.

P/E then re-derives automatically (market_cap ÷ net_income), so the whole Capital tab stays live.
"""
from __future__ import annotations

from datetime import datetime, timezone

from . import edgar
from .schema import MetricObservation

# competitor_id -> Yahoo Finance ticker. US-listed C-corps only: market cap = price × SEC
# `dei` common shares is exact for single-class C-corps. EXCLUDED (kept on hand-verified caps):
# Blackstone & AB (partnership / multi-class — `dei` Class-A shares omit founder/operating-partnership
# units, understating cap) and Federated (Class A/B; no aggregated `dei` share count).
TICKERS: dict[str, str] = {
    "BL": "BLK", "TROW": "TROW", "IVZ": "IVZ", "FT": "BEN",
    "WisdomTree": "WT", "JH": "JHG", "AMG": "AMG",
}


def _price(ticker: str) -> tuple[float, str, str]:
    """(price, currency, trade-date YYYY-MM-DD) from the Yahoo Finance chart API."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1d"
    meta = edgar.get_json(url, use_cache=False)["chart"]["result"][0]["meta"]  # always fresh price
    ts = meta.get("regularMarketTime")
    date = datetime.fromtimestamp(ts, timezone.utc).strftime("%Y-%m-%d") if ts else "2025-12-31"
    return float(meta["regularMarketPrice"]), meta.get("currency", "USD"), date


def _shares(cik: str) -> float | None:
    """Latest cover-page shares outstanding from SEC XBRL dei facts."""
    node = edgar.companyfacts(cik).get("facts", {}).get("dei", {}).get("EntityCommonStockSharesOutstanding")
    if not node:
        return None
    pts = [p for unit in node.get("units", {}).values() for p in unit if p.get("val") and p.get("end")]
    return max(pts, key=lambda p: p["end"])["val"] if pts else None


def build(competitor_id: str, cik: str, now_iso: str) -> list[MetricObservation]:
    ticker = TICKERS.get(competitor_id)
    if not ticker:
        return []
    try:
        price, ccy, date = _price(ticker)
        shares = _shares(cik)
    except Exception as e:
        print(f"  ! {competitor_id} market data: {e}")
        return []
    if not price or not shares:
        return []
    mcap = price * shares
    quote = (f"{ticker} ${price:,.2f} {ccy} (Yahoo Finance close {date}) × {shares:,.0f} shares "
             f"outstanding (SEC XBRL) = market cap ${mcap/1e9:,.1f}bn")
    return [MetricObservation(
        competitor_id=competitor_id, metric_key="market_cap", value=mcap, unit="USD", currency="USD",
        period_type="FY", period_end=date, basis="external",
        definition_note="Live market cap = Yahoo Finance price × SEC XBRL shares outstanding.",
        source_doc="Market data", source_url=f"https://finance.yahoo.com/quote/{ticker}",
        source_section=quote, confidence=0.85, extracted_by="market-data", extracted_at=now_iso,
    )]
