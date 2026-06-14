"""Compose an evidence-cited strategy brief from signals + metrics.

Spike note: this is a DETERMINISTIC rules→claims composer. In production the LLM-synthesis
step (locked spec §D) replaces the templating — but the CITATION INVARIANT enforced here
('no claim without a linked signal') is the part that must survive into production.
"""
from __future__ import annotations


class UncitedClaimError(AssertionError):
    pass


def _ids(sigs):
    return [s.id for s in sigs]


def compose(issuer: str, records: list[dict], signals: list) -> dict:
    by_type: dict[str, list] = {}
    for s in signals:
        by_type.setdefault(s.type, []).append(s)

    claims = []

    # Fee strategy
    fee_below = [s for s in by_type.get("fee_positioning", []) if s.after is not None and s.before is not None and s.after < s.before]
    if fee_below:
        n = len(fee_below)
        claims.append({
            "text": f"{issuer} is competing on price in core exposures — {n} of its products are priced below their peer-group median TER.",
            "cited_signal_ids": _ids(fee_below),
            "confidence": "high", "inferred": True,
        })

    # Active / new-product expansion
    launches = by_type.get("launch", [])
    active_launch = [s for s in launches if "active" in (s.entity.get("name") or "").lower()]
    if active_launch:
        claims.append({
            "text": f"{issuer} is extending into ACTIVE fixed income — recent active-strategy launches in the ETF wrapper.",
            "cited_signal_ids": _ids(active_launch),
            "confidence": "high", "inferred": True,
        })
    elif launches:
        claims.append({
            "text": f"{issuer} is actively launching new products ({len(launches)} recent inceptions in scope).",
            "cited_signal_ids": _ids(launches),
            "confidence": "medium", "inferred": True,
        })

    # Flow momentum
    aum_up = [s for s in by_type.get("aum_trend", []) if isinstance(s.after, (int, float)) and isinstance(s.before, (int, float)) and s.after > s.before]
    aum_dn = [s for s in by_type.get("aum_trend", []) if isinstance(s.after, (int, float)) and isinstance(s.before, (int, float)) and s.after < s.before]
    if aum_up:
        claims.append({
            "text": f"Asset momentum is positive across {len(aum_up)} tracked products (AUM rising over the trailing quarter — directional flow proxy).",
            "cited_signal_ids": _ids(aum_up),
            "confidence": "medium", "inferred": True,
        })
    if aum_dn:
        claims.append({
            "text": f"{len(aum_dn)} tracked products show AUM contraction over the trailing quarter — watch for outflows.",
            "cited_signal_ids": _ids(aum_dn),
            "confidence": "medium", "inferred": True,
        })

    # Index-tracking quality
    td = by_type.get("tracking_difference", [])
    tight = [s for s in td if isinstance(s.after, (int, float)) and abs(s.after) <= 0.005]
    if tight:
        claims.append({
            "text": f"Index-tracking quality is a live selling point — {len(tight)} products track within ±0.5% p.a. of benchmark.",
            "cited_signal_ids": _ids(tight),
            "confidence": "medium", "inferred": True,
        })

    # Demonstrated fee-move detection (labelled)
    demo = by_type.get("fee_change", [])
    if demo:
        claims.append({
            "text": "Pipeline can flag competitor fee moves the moment a KIID/holdings version changes (mechanism shown on a constructed example; needs a 2nd crawl for live detection).",
            "cited_signal_ids": _ids(demo),
            "confidence": "n/a", "inferred": False,
        })

    # CITATION INVARIANT
    valid = {s.id for s in signals}
    for c in claims:
        cites = [cid for cid in c["cited_signal_ids"] if cid in valid]
        if not cites:
            raise UncitedClaimError(f"Claim has no valid citation: {c['text']!r}")
        c["cited_signal_ids"] = cites

    return {
        "issuer": issuer,
        "n_signals": len(signals),
        "n_claims": len(claims),
        "uncited_claims": 0,
        "claims": claims,
    }


def to_markdown(brief: dict, sig_by_id: dict) -> str:
    lines = [f"# Strategy brief — {brief['issuer']}",
             f"_{brief['n_claims']} claims · {brief['n_signals']} signals · "
             f"{brief['uncited_claims']} uncited_\n"]
    for c in brief["claims"]:
        cite_str = " ".join(f"`{cid}`" for cid in c["cited_signal_ids"])
        tag = "" if c["inferred"] else " *(mechanism demo)*"
        lines.append(f"- {c['text']}{tag}  \n  evidence: {cite_str}")
    lines.append("\n## Evidence index")
    for c in brief["claims"]:
        for cid in c["cited_signal_ids"]:
            s = sig_by_id.get(cid)
            if s:
                lines.append(f"- `{cid}` [{s.type}] {s.entity.get('name')}: {s.note}")
    return "\n".join(lines)
