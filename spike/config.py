"""AM Compass — v1 walking-skeleton spike configuration.

HARD CONSTRAINT: this spike reads from the crawl READ-ONLY and writes only inside
the am-compass repo. It NEVER writes to ~/Desktop/ishares_offline and NEVER
touches any analitiks repository.
"""
from pathlib import Path

# Read-only source crawl (never modified)
CRAWL_ROOT = Path.home() / "Desktop" / "ishares_offline"

# Repo-local output (the only place the spike writes data)
REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "spike" / "out"

# Issuers with the full structured pipeline (detail.html + data/fund_data.xls)
FULL_PIPELINE_ISSUERS = ["iShares", "Amundi", "StateStreet"]
# Issuers that are docs-only (no structured data) — documented, not parsed for perf
DOCS_ONLY_ISSUERS = ["Invesco"]

# Curated iShares EU-UCITS products for the end-to-end proof (FI + equity mix).
# Selected by portfolioId; the runner resolves the folder via _meta/catalog.json
# and skips any that are absent.
TARGET_ISHARES_PORTFOLIOS = {
    251832: ("fixed_income", "iShares $ Corp Bond UCITS ETF"),
    350665: ("fixed_income", "iShares $ AAA CLO Active UCITS ETF"),     # recent active launch
    309959: ("fixed_income", "iShares High Yield Corp Bond ESG UCITS ETF"),
    348766: ("equity", "iShares MSCI Europe Small Cap UCITS ETF"),
    285209: ("equity", "iShares Edge MSCI USA Quality Factor UCITS ETF"),
    251952: ("equity", "iShares STOXX Europe 600 Media UCITS ETF"),
}

# Risk-free rate assumption for Sharpe (spike-only placeholder, annualized).
RISK_FREE_ANNUAL = 0.03
