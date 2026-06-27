"""Stdlib HTML table extractor — for reading the multi-dimensional AuM / revenue tables in a
10-K's MD&A (which don't linearize from flattened text). Returns each <table> as a list of
rows, each a list of cleaned cell strings. Handles the nested tables filings use for layout.
"""
from __future__ import annotations
from html.parser import HTMLParser


class _TP(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.tables: list[list[list[str]]] = []
        self._stack: list[list[list[str]]] = []  # open tables (innermost last)
        self._row: list[str] | None = None
        self._cell: list[str] | None = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            rows: list[list[str]] = []
            self.tables.append(rows)
            self._stack.append(rows)
        elif tag == "tr" and self._stack:
            self._row = []
            self._stack[-1].append(self._row)
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._cell is not None:
            self._row.append(" ".join("".join(self._cell).split()))
            self._cell = None
        elif tag == "tr":
            self._row = None
        elif tag == "table" and self._stack:
            self._stack.pop()
            self._row = None

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)

    def handle_entityref(self, name):
        if self._cell is not None:
            self._cell.append(" " if name in ("nbsp", "#160") else "")

    def handle_charref(self, name):
        if self._cell is not None:
            self._cell.append(" " if name in ("160",) else "")


def tables(html: str) -> list[list[list[str]]]:
    p = _TP()
    p.feed(html)
    return p.tables


def num(cell: str) -> float | None:
    """Parse a table cell into a number (handles $, commas, %, and (parens)=negative)."""
    s = cell.replace("$", "").replace(",", "").replace("%", "").strip()
    neg = s.startswith("(") and s.endswith(")")
    s = s.strip("()")
    if not s:
        return None
    try:
        v = float(s)
    except ValueError:
        return None
    return -v if neg else v


def find(tbls: list[list[list[str]]], must_have: list[str], min_rows: int = 3) -> list[list[list[str]]]:
    """Tables whose flattened text contains every label in `must_have` (case-insensitive)."""
    out = []
    for t in tbls:
        if len(t) < min_rows:
            continue
        flat = " ".join(c for row in t for c in row).lower()
        if all(m.lower() in flat for m in must_have):
            out.append(t)
    return out
