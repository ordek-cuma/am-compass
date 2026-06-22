"""Per-competitor document manifest = the delta state.

archive/<slug>/manifest.json holds every document with a stable doc_id (EDGAR accession or
url-hash), its sha256, localPath and fetched_at. On each crawl we diff the discovered set
against this to decide new / changed / unchanged.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load(path: Path) -> dict | None:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None
    return None


def save(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")


def index_by_id(m: dict | None) -> dict:
    return {d["doc_id"]: d for d in (m or {}).get("documents", [])}
