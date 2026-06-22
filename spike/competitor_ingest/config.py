"""Competitor-ingest configuration. Self-contained (no dependency on the spike root)."""
from __future__ import annotations
import os
from pathlib import Path

# Repo-local output (the ONLY place this agent writes).
OUT_DIR = Path(__file__).resolve().parents[1] / "out" / "competitor_ingest"
CACHE_DIR = OUT_DIR / "cache"

# SEC requires a descriptive User-Agent that identifies the requester.
# Override via env COMPASS_SEC_UA if you want a different contact.
SEC_UA = os.environ.get("COMPASS_SEC_UA", "AM-Compass competitive-intel research (tanerakcok@gmail.com)")

# SEC fair-access: <=10 req/s. We throttle well under that.
SEC_MIN_INTERVAL = 0.22  # seconds between requests

# LLM extraction (optional — only runs when ANTHROPIC_API_KEY is set).
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
EXTRACT_MODEL = os.environ.get("COMPASS_EXTRACT_MODEL", "claude-sonnet-4-6")
