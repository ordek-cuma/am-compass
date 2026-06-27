"""HSBC INKA (HSBC T&B) — Competitor Data Scraper, via parent HSBC Holdings plc.

HSBC INKA (HSBC's German Master-KVG) publishes no corporate financials of its own; the group
reporting comes from HSBC Holdings plc. The all-reporting/group page (?page=N&take=20) lists many
PDFs per reporting event — we keep the core English corporate set (Annual Report & Accounts,
Interim Report, quarterly earnings releases & investor presentations) and drop the heavy noise:
Chinese-language duplicates, call transcripts, data packs, Form 6-K, Pillar 3 / ESG. Year + type
from text/filename; last 5y; PDFs download via plain HTTP.
"""
from .base import CompetitorDataScraper, PageSpec

_LIST = "https://www.hsbc.com/investors/results-and-announcements/all-reporting/group"

_EXTRACT = r"""
() => {
  const YEAR_MIN = 2021;
  const KEEP = /annual report|annual results|interim report|interim results|half.?year|earnings release|\bresults\b|presentation to investors|strategic report|form 20-?f/i;
  const DROP = /chinese|\bsea-|\b-c-\b|cantonese|simplified|transcript|data pack|form 6-?k|pillar 3|\besg\b|sustainab|tcfd|climate|green bond|net zero|terms? and conditions|circular/i;
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll("a[href]")) {
    const h = a.href;
    if (!/\.pdf(\?|$)/i.test(h)) continue;
    const t = (a.innerText || a.getAttribute('aria-label') || a.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
    const fn = decodeURIComponent((h.split('/').pop() || '').split('?')[0]);
    const k = (t + ' ' + fn).toLowerCase();
    if (DROP.test(k) || !KEEP.test(k)) continue;
    const m = (t + ' ' + fn).match(/(20[0-3]\d)/);
    const y = m ? +m[1] : null;
    if (!y || y < YEAR_MIN) continue;
    if (seen.has(h)) continue;
    seen.add(h);
    const group = /annual report|annual results|strategic report|20-?f/.test(k) ? 'Annual'
                : /interim|half.?year/.test(k) ? 'Quarterly'
                : /earnings|results|presentation/.test(k) ? 'Earnings / Events' : 'Reports';
    let label = (t && t.length > 3) ? t : fn.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (y && !label.includes(String(y))) label = label + ' ' + y;
    out.push({ url: h, label: label.slice(0, 90), group });
  }
  return out;
}
"""


def _pg(page):
    return PageSpec(f"{_LIST}?page={page}&take=20", group="Reports", extract=_EXTRACT, settle=8000, scroll=6)


SCRAPER = CompetitorDataScraper(
    code="HSBC T&B",
    name="HSBC INKA (via HSBC Holdings)",
    notes="parent HSBC Holdings plc all-reporting/group (?page=N&take=20); keep English "
          "annual/interim/earnings/presentation, drop Chinese/transcript/data-pack/6-K/Pillar-3; "
          "last 5y; stdlib download.",
    channel="chrome",
    pages=[_pg(1), _pg(2), _pg(3)],
)
