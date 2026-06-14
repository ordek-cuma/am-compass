"""AM Compass v1 walking-skeleton — orchestrator.

Runs crawl(read-only) -> parse -> performance -> signals -> cited brief on a curated
set of iShares EU-UCITS FI+equity products, writes artifacts into spike/out/.
"""
from __future__ import annotations
import json
import datetime as dt
from pathlib import Path

import config as C
import ishares_xls as X
import documents as D
import performance as P
import signals as S
import brief as B


def _catalog_folder_map(issuer: str) -> dict[int, str]:
    cat = C.CRAWL_ROOT / issuer / "_meta" / "catalog.json"
    if not cat.exists():
        return {}
    data = json.loads(cat.read_text(encoding="utf-8", errors="ignore"))
    return {e["portfolioId"]: e["folder"] for e in data if e.get("portfolioId")}


def _aum_now_prev(series):
    pts = [(r["date"], r["aum"]) for r in series if r.get("aum")]
    if len(pts) < 2:
        return None, None
    now_d, now_v = pts[-1]
    target = now_d - dt.timedelta(days=91)
    prev = None
    for d, v in pts:
        if d <= target:
            prev = v
        else:
            break
    return now_v, prev


def _top10_weight(holdings):
    ws = []
    for h in holdings:
        w = X.german_number(h.get("Gewichtung (%)") or h.get("Weight (%)") or "")
        if w is not None:
            ws.append(w)
    ws.sort(reverse=True)
    return round(sum(ws[:10]), 2) if ws else None


def _inception(parsed):
    for key in ("Inception Date",):
        v = parsed["holdings_meta"].get(key)
        if v:
            d = X.german_date(v)
            if d:
                return d
    for key in ("Auflagedatum", "Fondsauflegung"):
        v = parsed["characteristics"].get(key)
        if v:
            d = X.german_date(v)
            if d:
                return d
    return None


def build_records():
    folders = _catalog_folder_map("iShares")
    records = []
    for pid, (group, name) in C.TARGET_ISHARES_PORTFOLIOS.items():
        folder = folders.get(pid)
        if not folder:
            print(f"  · skip {pid} ({name}) — not in catalog")
            continue
        pdir = C.CRAWL_ROOT / "iShares" / folder
        xls = pdir / "data" / "fund_data.xls"
        if not xls.exists():
            print(f"  · skip {pid} ({name}) — no fund_data.xls")
            continue
        parsed = X.parse_fund_data(xls)
        perf = P.compute(parsed["series"], parsed["ter"], C.RISK_FREE_ANNUAL)
        aum_now, aum_prev = _aum_now_prev(parsed["series"])
        docsum = D.summarize(D.load(pdir))
        rec = {
            "portfolioId": pid,
            "isin": parsed["characteristics"].get("ISIN") or docsum.get("isin"),
            "name": name,
            "group": group,
            "ter": parsed["ter"],
            "inception": _inception(parsed),
            "perf": perf,
            "aum_now": aum_now,
            "aum_prev": aum_prev,
            "top10_weight": _top10_weight(parsed["holdings"]),
            "n_holdings": len(parsed["holdings"]),
            "docs": docsum,
            "source_xls": str(xls.relative_to(C.CRAWL_ROOT)),
        }
        records.append(rec)
        print(f"  ✓ {pid} {name}: TER={rec['ter']}  3yNet={perf.get('return_3y_net')}  "
              f"holdings={rec['n_holdings']}  series={perf.get('n_points')}")
    return records


def main():
    C.OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("== parse + performance ==")
    records = build_records()
    assert records, "no records built"
    as_of = max((r["perf"].get("as_of") for r in records if r["perf"].get("as_of")), default=None)
    as_of_d = dt.date.fromisoformat(as_of) if as_of else dt.date.today()

    print("== signals ==")
    sigs = S.build_signals(records, as_of_d)
    sig_by_id = {s.id: s for s in sigs}
    print(f"  {len(sigs)} signals across {len(records)} products")

    print("== cited brief (iShares) ==")
    br = B.compose("iShares (BlackRock)", records, sigs)
    print(f"  {br['n_claims']} claims, uncited={br['uncited_claims']}")

    # serialize (dates -> iso)
    def _ser(o):
        if isinstance(o, dt.date):
            return o.isoformat()
        raise TypeError
    (C.OUT_DIR / "records.json").write_text(json.dumps(records, default=_ser, indent=2, ensure_ascii=False))
    (C.OUT_DIR / "signals.json").write_text(json.dumps([s.dict() for s in sigs], default=_ser, indent=2, ensure_ascii=False))
    (C.OUT_DIR / "brief.json").write_text(json.dumps(br, indent=2, ensure_ascii=False))
    (C.OUT_DIR / "brief.md").write_text(B.to_markdown(br, sig_by_id))

    # acceptance gate
    twr_ok = sum(1 for r in records if r["perf"].get("return_3y_net") is not None)
    print("\n== ACCEPTANCE ==")
    print(f"  signals >=1 : {len(sigs) >= 1}  ({len(sigs)})")
    print(f"  TWR >=3 prod: {twr_ok >= 3}  ({twr_ok})")
    print(f"  brief uncited==0: {br['uncited_claims'] == 0}")
    print(f"  artifacts -> {C.OUT_DIR}")


if __name__ == "__main__":
    main()
