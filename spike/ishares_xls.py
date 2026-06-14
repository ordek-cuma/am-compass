"""Parser for iShares `data/fund_data.xls` (Microsoft XML Spreadsheet 2003 / SpreadsheetML).

Rule-based extraction (the "rules" half of the hybrid parsing decision). Pure stdlib.
Yields: characteristics (incl. TER), holdings, and the daily NAV / total-return /
benchmark-return / AUM time series.
"""
from __future__ import annotations
import re
import datetime as dt
import xml.etree.ElementTree as ET
from pathlib import Path

_PFX = ["ss", "o", "x", "html", "c", "v", "dt", "xsi"]
_L = lambda t: t.split("}")[-1]

_DE_MONTHS = {
    "jan": 1, "feb": 2, "mär": 3, "maer": 3, "marz": 3, "apr": 4, "mai": 5,
    "jun": 6, "jul": 7, "aug": 8, "sep": 9, "okt": 10, "nov": 11, "dez": 12,
}


def german_number(s: str):
    """Parse a German- or dot-decimal number string to float. Returns None if not numeric."""
    if s is None:
        return None
    s = re.sub(r"[^\d.,\-]", "", s.strip())
    if s in ("", "-", "--", "."):
        return None
    if "," in s:                      # German: dots=thousands, comma=decimal
        s = s.replace(".", "").replace(",", ".")
    elif s.count(".") > 1:            # dots used as thousands separators
        s = s.replace(".", "")
    try:
        return float(s)
    except ValueError:
        return None


def german_date(s: str):
    """Parse strings like '28.Mai2026', '16-Mai-2003', '12.Dez.2025', '30.Juni2003'."""
    if not s:
        return None
    m = re.search(r"(\d{1,2})[.\-\s]*([A-Za-zäÄ]+)\.?[.\-\s]*(\d{4})", s)
    if not m:
        return None
    day, mon, year = m.group(1), m.group(2).lower(), m.group(3)
    mon = mon.replace("ä", "a")[:3] if mon[:3] not in _DE_MONTHS else mon[:3]
    key = mon[:3]
    if key not in _DE_MONTHS:
        # try first-3 of normalized
        key = m.group(2).lower().replace("ä", "a")[:3]
    month = _DE_MONTHS.get(key)
    if not month:
        return None
    try:
        return dt.date(int(year), month, int(day))
    except ValueError:
        return None


def read_worksheets(path: Path) -> dict[str, list[list[str]]]:
    """Return {worksheet_name: [[cell_str, ...], ...]} honoring sparse ss:Index."""
    txt = Path(path).read_bytes().decode("utf-8-sig", errors="ignore")
    for pfx in _PFX:
        txt = txt.replace(f"<{pfx}:", "<").replace(f"</{pfx}:", "</").replace(f" {pfx}:", " ")
    txt = re.sub(r'\sxmlns(:\w+)?="[^"]*"', "", txt)
    root = ET.fromstring(txt)
    sheets: dict[str, list[list[str]]] = {}
    for ws in root.iter():
        if _L(ws.tag) != "Worksheet":
            continue
        name = next((v for k, v in ws.attrib.items() if _L(k) == "Name"), "Sheet")
        rows: list[list[str]] = []
        for r in ws.iter():
            if _L(r.tag) != "Row":
                continue
            cells: list[str] = []
            col = 0
            for c in r:
                if _L(c.tag) != "Cell":
                    continue
                idx = next((int(v) for k, v in c.attrib.items() if _L(k) == "Index"), None)
                if idx is not None:
                    while col < idx - 1:
                        cells.append("")
                        col += 1
                data = "".join(d.text or "" for d in c.iter() if _L(d.tag) == "Data")
                cells.append(data)
                col += 1
            rows.append(cells)
        sheets[name] = rows
    return sheets


def parse_fund_data(path: Path) -> dict:
    sheets = read_worksheets(path)

    def find_sheet(*keys):
        for name in sheets:
            low = name.lower()
            if any(k in low for k in keys):
                return sheets[name]
        return []

    # --- Characteristics (Überblick) — label/value pairs ---
    characteristics: dict[str, str] = {}
    for row in find_sheet("überblick", "uberblick", "overview"):
        if len(row) >= 2 and row[0].strip():
            characteristics[row[0].strip()] = row[1].strip()
    ter = None
    for label, val in characteristics.items():
        if re.search(r"gesamtkosten|laufende kosten|ongoing|expense|\bter\b|ter\)", label, re.I):
            ter = german_number(val)
            break

    # --- Holdings (Positionen) ---
    pos = find_sheet("positionen", "holdings")
    holdings, hdr_idx = [], None
    meta = {}
    for i, row in enumerate(pos[:8]):
        if row and row[0].strip() in ("Inception Date", "Fund Holdings as of", "Number of Securities", "Shares Outstanding"):
            meta[row[0].strip()] = row[1].strip() if len(row) > 1 else ""
    for i, row in enumerate(pos):
        if row and row[0].strip() in ("Emittententicker", "Ticker", "Issuer Ticker"):
            hdr_idx = i
            break
    if hdr_idx is not None:
        header = [h.strip() for h in pos[hdr_idx]]
        for row in pos[hdr_idx + 1:]:
            if not any(c.strip() for c in row):
                continue
            rec = {header[j] if j < len(header) else f"c{j}": row[j] for j in range(len(row))}
            holdings.append(rec)

    # --- Time series (Historisch): per, Währung, NAV, shares, AUM, ret_series, bench_series ---
    hist = find_sheet("historisch", "historical")
    series = []
    if hist:
        for row in hist[1:]:
            if len(row) < 3:
                continue
            d = german_date(row[0])
            nav = german_number(row[2]) if len(row) > 2 else None
            if d is None or nav is None:
                continue
            series.append({
                "date": d,
                "currency": row[1].strip() if len(row) > 1 else "",
                "nav": nav,
                "aum": german_number(row[4]) if len(row) > 4 else None,
                "ret": german_number(row[5]) if len(row) > 5 else None,        # product total-return index
                "bench": german_number(row[6]) if len(row) > 6 else None,      # benchmark return index
            })
    series.sort(key=lambda x: x["date"])

    return {
        "characteristics": characteristics,
        "ter": ter,
        "holdings_meta": meta,
        "holdings": holdings,
        "series": series,
    }
