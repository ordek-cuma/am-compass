"""Cross-issuer structural recon over the crawl (read-only).

Answers spec §G4: how uniform is the crawl across issuers? Which issuers carry the
structured `data/fund_data.xls` + `detail.html` needed for the full pipeline, vs docs-only?
"""
from __future__ import annotations
import json
from pathlib import Path
import config as C

SAMPLE = 25


def scan_issuer(issuer_dir: Path) -> dict:
    products_dir = issuer_dir / "products"
    has_catalog = (issuer_dir / "_meta" / "catalog.json").exists()
    prods = sorted([p for p in products_dir.iterdir() if p.is_dir()]) if products_dir.exists() else []
    sample = prods[:SAMPLE]
    has_detail = has_data = has_docsjson = dup_artifacts = 0
    for p in sample:
        if (p / "detail.html").exists():
            has_detail += 1
        if (p / "data" / "fund_data.xls").exists():
            has_data += 1
        if (p / "documents.json").exists():
            has_docsjson += 1
        if any(" 2." in f.name for f in p.rglob("*") if f.is_file()):
            dup_artifacts += 1
    n = len(sample) or 1
    return {
        "issuer": issuer_dir.name,
        "has_catalog_json": has_catalog,
        "product_count": len(prods),
        "sampled": len(sample),
        "pct_detail_html": round(100 * has_detail / n),
        "pct_fund_data_xls": round(100 * has_data / n),
        "pct_documents_json": round(100 * has_docsjson / n),
        "pct_icloud_dupes": round(100 * dup_artifacts / n),
        "tier": "full" if has_data >= n * 0.5 else ("docs-only" if has_docsjson >= n * 0.5 else "sparse"),
    }


def main():
    C.OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows = []
    for d in sorted(C.CRAWL_ROOT.iterdir()):
        if not d.is_dir() or d.name.startswith(("_", ".")) or d.name == "annual_reports":
            continue
        if not (d / "products").exists() and not (d / "_meta").exists():
            continue
        rows.append(scan_issuer(d))
    (C.OUT_DIR / "inventory.json").write_text(json.dumps(rows, indent=2, ensure_ascii=False))
    print(f"{'issuer':<16}{'tier':<11}{'prods':>6}{'detail%':>8}{'xls%':>6}{'docs%':>6}{'dupes%':>7}")
    for r in rows:
        print(f"{r['issuer']:<16}{r['tier']:<11}{r['product_count']:>6}{r['pct_detail_html']:>8}"
              f"{r['pct_fund_data_xls']:>6}{r['pct_documents_json']:>6}{r['pct_icloud_dupes']:>7}")
    full = [r['issuer'] for r in rows if r['tier'] == 'full']
    print(f"\nfull-pipeline issuers ({len(full)}): {', '.join(full)}")


if __name__ == "__main__":
    main()
