"""Signal detection. Most signals are REAL from a single crawl snapshot
(launch, cross-sectional fee/performance positioning, AUM trend, tracking difference).

True temporal diffs (a fee CUT, holdings drift) need two snapshots — for the spike one
fee_change is emitted as a clearly-labelled CONSTRUCTED demo to prove the diff mechanism.
See FINDINGS.md (§G5).
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
import datetime as dt
import statistics


@dataclass
class Signal:
    id: str
    type: str
    entity: dict
    before: object
    after: object
    detected_at: str
    source: str
    confidence: str
    method: str            # "deterministic" | "cross-sectional" | "constructed-demo"
    note: str = ""

    def dict(self):
        return asdict(self)


def _median(xs):
    xs = [x for x in xs if x is not None]
    return statistics.median(xs) if xs else None


def build_signals(records: list[dict], as_of: dt.date) -> list[Signal]:
    sigs: list[Signal] = []
    seq = [1000]

    def nxt():
        seq[0] += 1
        return f"S-{seq[0]}"

    # peer medians within asset-class group
    groups: dict[str, list[dict]] = {}
    for r in records:
        groups.setdefault(r["group"], []).append(r)
    med_ter = {g: _median([x["ter"] for x in rs]) for g, rs in groups.items()}
    med_r3 = {g: _median([x["perf"].get("return_3y_net") for x in rs]) for g, rs in groups.items()}

    for r in records:
        ent = {"portfolioId": r.get("portfolioId"), "isin": r.get("isin"), "name": r["name"]}
        g = r["group"]
        src = r["source_xls"]

        # 1) launch (real) — inception within 18 months
        inc = r.get("inception")
        if inc and (as_of - inc).days <= 550:
            sigs.append(Signal(nxt(), "launch", ent, None, inc.isoformat(),
                               as_of.isoformat(), src, "high", "deterministic",
                               f"Inception {inc.isoformat()} — new product in {g}."))

        # 2) fee positioning (real, cross-sectional)
        if r["ter"] is not None and med_ter.get(g) is not None:
            delta = round(r["ter"] - med_ter[g], 4)
            stance = "below" if delta < 0 else "above" if delta > 0 else "at"
            sigs.append(Signal(nxt(), "fee_positioning", ent, med_ter[g], r["ter"],
                               as_of.isoformat(), src, "high", "cross-sectional",
                               f"TER {r['ter']:.2f}% is {stance} peer median {med_ter[g]:.2f}% ({g})."))

        # 3) performance positioning (real, cross-sectional)
        r3 = r["perf"].get("return_3y_net")
        if r3 is not None and med_r3.get(g) is not None:
            stance = "above" if r3 > med_r3[g] else "below"
            sigs.append(Signal(nxt(), "performance_positioning", ent,
                               round(med_r3[g], 4), round(r3, 4), as_of.isoformat(), src,
                               "medium", "cross-sectional",
                               f"3y net return {r3*100:.1f}% is {stance} peer median {med_r3[g]*100:.1f}% ({g})."))

        # 4) AUM trend (real) — flow-direction proxy over ~3 months
        if r.get("aum_now") and r.get("aum_prev"):
            chg = r["aum_now"] / r["aum_prev"] - 1
            if abs(chg) >= 0.02:
                sigs.append(Signal(nxt(), "aum_trend", ent, round(r["aum_prev"], 0),
                                   round(r["aum_now"], 0), as_of.isoformat(), src,
                                   "medium", "deterministic",
                                   f"AUM {'+' if chg>=0 else ''}{chg*100:.1f}% over ~3 months (flow proxy)."))

        # 5) tracking difference (real)
        td = r["perf"].get("tracking_difference_3y")
        if td is not None:
            sigs.append(Signal(nxt(), "tracking_difference", ent, None, round(td, 5),
                               as_of.isoformat(), src, "medium", "deterministic",
                               f"3y annualized tracking difference {td*100:.2f}% vs benchmark."))

        # 6) concentration (real)
        if r.get("top10_weight") is not None:
            sigs.append(Signal(nxt(), "concentration", ent, None, round(r["top10_weight"], 2),
                               as_of.isoformat(), src, "high", "deterministic",
                               f"Top-10 holdings = {r['top10_weight']:.1f}% of portfolio."))

    # 7) ONE constructed temporal fee-change demo (clearly labelled)
    demo = next((r for r in records if r.get("portfolioId") == 251832), records[0] if records else None)
    if demo:
        ent = {"portfolioId": demo.get("portfolioId"), "isin": demo.get("isin"), "name": demo["name"]}
        sigs.append(Signal(nxt(), "fee_change", ent, demo["ter"], round((demo["ter"] or 0.2) * 0.6, 2),
                           as_of.isoformat(), demo["source_xls"], "n/a", "constructed-demo",
                           "CONSTRUCTED demo (not observed): proves the fee-diff→signal mechanism. "
                           "Real temporal fee-change detection needs a 2nd crawl snapshot — see FINDINGS §G5."))
    return sigs
