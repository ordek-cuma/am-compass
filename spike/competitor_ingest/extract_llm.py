"""Optional LLM extraction of AM-specific KPIs from the 10-K (AuM, flows, fee revenue…).

These have no standard XBRL concept — they live in the MD&A narrative + supplemental
tables — so they need a reading model. Runs only when ANTHROPIC_API_KEY is set; otherwise
the pipeline returns XBRL financials and flags these as pending. Stdlib-only HTTP.
"""
from __future__ import annotations
import json
import re
import urllib.request

from . import config as C
from .schema import MetricObservation

# Fields the model fills. Mirrors the catalogue's AM-specific keys.
_FIELDS = [
    ("aum_total", "Total AuM at fiscal year-end, in USD millions."),
    ("aum_average", "Average AuM over the fiscal year, in USD millions."),
    ("net_flows", "Net new money / net flows for the fiscal year, in USD millions (negative if net outflows)."),
    ("mgmt_fee_revenue", "Investment management/advisory fee revenue for the year, in USD millions (exclude performance fees)."),
    ("performance_fees", "Performance/incentive fee revenue for the year, in USD millions."),
    ("headcount", "Total employees at fiscal year-end (a count)."),
]

_SCHEMA = {
    "type": "object",
    "properties": {
        "period_end": {"type": "string", "description": "Fiscal year-end date, ISO YYYY-MM-DD."},
        **{
            k: {
                "type": "object",
                "properties": {
                    "value": {"type": ["number", "null"], "description": desc},
                    "confidence": {"type": "number", "description": "0..1 confidence the value is correct."},
                    "source_quote": {"type": "string", "description": "Short verbatim phrase the value came from."},
                },
                "required": ["value", "confidence"],
            }
            for k, desc in _FIELDS
        },
    },
    "required": ["period_end"],
}


def _to_text(html: str) -> str:
    text = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", html)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = re.sub(r"&#160;|&nbsp;", " ", text)
    return re.sub(r"\s+", " ", text)


def _relevant_excerpt(html: str, max_chars: int = 32000) -> str:
    """Keep the window around the first AuM mention — where the rollforward table lives."""
    text = _to_text(html)
    m = re.search(r"assets under management", text, re.I)
    if not m:
        return text[:max_chars]
    start = max(0, m.start() - 4000)
    return text[start : start + max_chars]


def extract(competitor_id: str, html: str, source_url: str, now_iso: str) -> list[MetricObservation]:
    if not C.ANTHROPIC_API_KEY:
        return []  # graceful no-op without a key
    excerpt = _relevant_excerpt(html)
    body = {
        "model": C.EXTRACT_MODEL,
        "max_tokens": 1024,
        "tools": [{"name": "record_am_kpis", "description": "Record the asset-manager KPIs found in the filing.", "input_schema": _SCHEMA}],
        "tool_choice": {"type": "tool", "name": "record_am_kpis"},
        "messages": [{
            "role": "user",
            "content": (
                "Extract the asset-manager KPIs for the most recent fiscal year from this 10-K excerpt. "
                "Use USD millions for currency values. If a figure is not present, set value to null. "
                "Only use figures explicitly stated.\n\n" + excerpt
            ),
        }],
    }
    try:
        data = _call(body)
    except Exception as e:  # network/auth/parse — never fail the whole run
        print(f"  [llm] extraction skipped ({type(e).__name__}: {e})")
        return []

    period_end = data.get("period_end", now_iso[:10])
    out: list[MetricObservation] = []
    for key, _desc in _FIELDS:
        field = data.get(key) or {}
        val = field.get("value")
        if val is None:
            continue
        unit = "count" if key == "headcount" else "USD"
        out.append(MetricObservation(
            competitor_id=competitor_id,
            metric_key=key,
            value=float(val) * (1e6 if unit == "USD" else 1),  # millions -> base units
            unit=unit,
            currency="USD" if unit == "USD" else None,
            period_type="FY",
            period_end=period_end,
            basis="reported",
            definition_note="LLM-extracted from 10-K narrative/tables.",
            source_doc="10-K",
            source_url=source_url,
            source_section=(field.get("source_quote") or "")[:160],
            confidence=round(float(field.get("confidence", 0.5)), 2),
            extracted_by=C.EXTRACT_MODEL,
            extracted_at=now_iso,
        ))
    return out


def _call(body: dict) -> dict:
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode(),
        headers={
            "x-api-key": C.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = json.loads(resp.read().decode())
    for block in payload.get("content", []):
        if block.get("type") == "tool_use":
            return block["input"]
    return {}
