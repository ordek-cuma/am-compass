"""State Street (SSgA) — Competitor Data Scraper.

investors.statestreet.com (q4cdn). The user's filings-and-reports hub has many sections, each
its own page; every page loads its whole history at once and exposes q4cdn .pdf/.xls URLs with
descriptive filenames (link text is generic, so labels are derived from the filename, and the
year/quarter is parsed from it).

Scope (user's choice): Quarterly Results + Annual Reports & Proxy capped to the last 5 years;
the regulatory sections (Basel III, U.S. LCR, Dodd-Frank stress test, Resolution Plans, SSGM
LLC) kept in full. SEC Filings (overlaps Quarterly/Annual) and Insider Filings (Form-3/4/5
ownership noise) are intentionally skipped.
"""
from .base import CompetitorDataScraper, PageSpec

_B = "https://investors.statestreet.com/filings-and-reports/"

# Filename → label + year (handles STT-1Q26-… two-digit quarter-years and YYYY dates). YEAR_MIN
# (0 = keep all) drops anything older than the cap.
_EXTRACT_TMPL = r"""
() => {
  const YEAR_MIN = __YMIN__;
  const isDoc = h => /\.pdf(\?|$)|\.xlsx?(\?|$)/i.test(h);
  const fileLabel = h => {
    let n = (h.split('/').pop() || '').split('?')[0].replace(/\.(pdf|xlsx?)$/i, '');
    n = n.replace(/^(STT|SSC)[-_]?/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    n = n.replace(/\bv?final\b/ig, '').replace(/\b(rgb|web|secured?|vf)\b/ig, '').replace(/\s+/g, ' ').trim();
    return n.replace(/\b\w/g, c => c.toUpperCase());
  };
  const yearOf = h => {
    const fn = (h.split('/').pop() || '');
    let m = fn.match(/(\d)Q(\d{2})\b/i); if (m) return 2000 + (+m[2]);
    for (const y of (fn.match(/20[0-2]\d/g) || []).map(Number)) if (y >= 2005 && y <= 2027) return y;
    return null;
  };
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll('a[href]')) {
    const h = a.href;
    if (!h || seen.has(h) || !isDoc(h)) continue;
    const y = yearOf(h);
    if (YEAR_MIN && (y === null || y < YEAR_MIN)) continue;   // capped sections require a valid recent year
    seen.add(h);
    out.push({ url: h, label: fileLabel(h).slice(0, 90) || 'Document' });
  }
  return out;
}
"""

_EXTRACT_5Y = _EXTRACT_TMPL.replace("__YMIN__", "2021")
_EXTRACT_ALL = _EXTRACT_TMPL.replace("__YMIN__", "0")


def _page(path, group, extract):
    return PageSpec(url=_B + path, group=group, extract=extract, settle=5000)


SCRAPER = CompetitorDataScraper(
    code="SSgA",
    name="State Street",
    notes="q4cdn; many section pages, each loads full history; filename-derived labels. "
          "Quarterly+Annual capped 5y; regulatory sections full; SEC/Insider skipped.",
    pages=[
        _page("quarterly-results/default.aspx", "Quarterly", _EXTRACT_5Y),
        _page("annual-reports/default.aspx", "Annual", _EXTRACT_5Y),
        _page("supplemental-public-disclosure-of-basel-iii-regulatory-capital/default.aspx", "Regulatory", _EXTRACT_ALL),
        _page("u-s-liquidity-coverage-ratio-disclosures/default.aspx", "Regulatory", _EXTRACT_ALL),
        _page("dodd-frank-stress-test-disclosure/default.aspx", "Regulatory", _EXTRACT_ALL),
        _page("resolution-plans/default.aspx", "Regulatory", _EXTRACT_ALL),
        _page("ssgm-llc-statements-of-financial-condition/default.aspx", "Regulatory", _EXTRACT_ALL),
    ],
)
