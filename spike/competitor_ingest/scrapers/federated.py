"""Federated Hermes (FED) — Competitor Data Scraper.

federatedhermes.com/.../sec-filings.do — a SEC-filings TABLE (FILING TYPE + FILING DATE
columns); each row's download link is tokenized (?token=…) with a generic "PDF" label, so the
form + date are read from the row text. Whitelist the core corporate forms (the page also
lists ownership/other noise), last 5 years. PDFs download via plain HTTP.
"""
from .base import CompetitorDataScraper, PageSpec

_EXTRACT = r"""
() => {
  const KEEP = /(10-?K|10-?Q|8-?K|DEF\s*14A|DEFA\s*14A|S-\d|424B|ARS)/i;
  const out = [], seen = new Set();
  for (const tr of document.querySelectorAll('tr')) {
    const txt = (tr.innerText || '').replace(/\s+/g, ' ').trim();
    const fm = txt.match(/^([A-Za-z0-9/\-]+)\s+(\d{2}-\d{2}-(\d{4}))/);   // "S-8 05-04-2026 …"
    if (!fm) continue;
    const form = fm[1], y = +fm[3];
    if (!KEEP.test(form) || y < 2021) continue;
    const a = tr.querySelector("a[href*='token'], a[href*='.pdf']");
    if (!a || !a.href || seen.has(a.href)) continue;
    seen.add(a.href);
    const group = /10-?K/i.test(form) ? 'Annual' : /10-?Q/i.test(form) ? 'Quarterly'
                : /8-?K/i.test(form) ? 'Earnings / Events' : /14A/i.test(form) ? 'Proxy' : 'Reports';
    const label = (form + ' - ' + fm[2]).slice(0, 80);
    out.push({ url: a.href, label, group, id: 'FED ' + label });   // stable id (URL token is per-session)
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="FED",
    name="Federated Hermes",
    notes="sec-filings.do TABLE; tokenized links, form+date from row text; whitelist core "
          "forms; last 5y; stdlib download.",
    pages=[PageSpec("https://www.federatedhermes.com/us/about/investor-relations/sec-filings.do",
                    group="Reports", extract=_EXTRACT, settle=5000)],
)
