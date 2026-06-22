"""Phase-1 watchlist: US-listed bellwethers, resolved to CIKs via EDGAR.

Hardcoded CIKs are a fallback; resolve_cik() is authoritative (CIKs can change —
BlackRock's did after its 2024 holdco reorg).
"""
from __future__ import annotations
from dataclasses import dataclass

from . import edgar


@dataclass
class Competitor:
    competitor_id: str  # matches the web app's competitor code
    name: str
    ticker: str
    regime: str  # disclosure regime (Radar Category)
    cik_fallback: str
    cik_override: str | None = None  # use a specific CIK (e.g. operating entity), skip ticker resolution


BELLWETHERS: list[Competitor] = [
    Competitor("BL", "BlackRock", "BLK", "US-listed", "0002012383"),
    Competitor("TROW", "T. Rowe Price", "TROW", "US-listed", "0001113169"),
    Competitor("IVZ", "Invesco", "IVZ", "US-listed", "0000914208"),
    Competitor("FT", "Franklin Resources", "BEN", "US-listed", "0000038777"),
    # AB: the ticker resolves to the holding LP (pass-through, ~1 tagged metric); the
    # operating partnership AllianceBernstein L.P. carries the real financials.
    Competitor("AB", "AllianceBernstein", "AB", "US-listed", "0000825313", cik_override="0001109448"),
    # Other US-listed pure-play AMs (group financials ≈ AM financials → clean to ingest).
    Competitor("FED", "Federated Hermes", "FHI", "US-listed", "0001056288"),
    Competitor("WisdomTree", "WisdomTree", "WT", "US-listed", "0000880631"),
    Competitor("JH", "Janus Henderson", "JHG", "US-listed", "0001633917"),
    Competitor("AMG", "Affiliated Managers Group", "AMG", "US-listed", "0001004434"),
]


def resolve(c: Competitor) -> str:
    """CIK: explicit override > live ticker lookup > pinned fallback."""
    if c.cik_override:
        return c.cik_override
    try:
        return edgar.resolve_cik(c.ticker) or c.cik_fallback
    except Exception:
        return c.cik_fallback
