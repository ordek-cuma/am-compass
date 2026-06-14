"""Export the spike pipeline output as one consolidated dataset for the web skeleton.

Writes web/src/data/dataset.json: { records, signals, brief, inventory, generated_at }.
Reuses the spike modules so the UI shows REAL computed data, not dummy.
"""
from __future__ import annotations
import json
import datetime as dt
from pathlib import Path

import config as C
import signals as S
import brief as B
import s1_inventory as INV
from run_spike import build_records

WEB_DATA = C.REPO_ROOT / "web" / "src" / "data" / "dataset.json"


def _ser(o):
    if isinstance(o, dt.date):
        return o.isoformat()
    raise TypeError(f"not serializable: {type(o)}")


def main():
    records = build_records()
    as_of = max((r["perf"].get("as_of") for r in records if r["perf"].get("as_of")), default=None)
    as_of_d = dt.date.fromisoformat(as_of) if as_of else dt.date.today()
    sigs = S.build_signals(records, as_of_d)
    br = B.compose("iShares (BlackRock)", records, sigs)

    inventory = []
    for d in sorted(C.CRAWL_ROOT.iterdir()):
        if not d.is_dir() or d.name.startswith(("_", ".")) or d.name == "annual_reports":
            continue
        if not (d / "products").exists() and not (d / "_meta").exists():
            continue
        inventory.append(INV.scan_issuer(d))

    dataset = {
        "generated_at": as_of_d.isoformat(),
        "scope": "EU-UCITS · fixed income + equity · iShares (walking skeleton)",
        "records": records,
        "signals": [s.dict() for s in sigs],
        "brief": br,
        "inventory": inventory,
    }
    WEB_DATA.parent.mkdir(parents=True, exist_ok=True)
    WEB_DATA.write_text(json.dumps(dataset, default=_ser, indent=2, ensure_ascii=False))
    print(f"wrote {WEB_DATA}  ({len(records)} products, {len(sigs)} signals, "
          f"{br['n_claims']} claims, {len(inventory)} issuers)")


if __name__ == "__main__":
    main()
