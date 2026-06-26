"""Natixis Investment Managers (NAT) — Competitor Data Scraper.

Natixis IM is a business line of Natixis (delisted, wholly owned by Groupe BPCE), so the
corporate documents come from the Natixis/BPCE financial-information hub. That page is a very
large catalogue (~680 PDFs) mixing the wanted corporate filings with heavy noise — UK
pension-trustee statements, SREP letters, ESG/stewardship reports, voting records. We keep only
the core corporate set (Universal Registration Document = the annual report, half-year/interim,
results press releases & slideshows) and drop the rest. Year from text/filename; last 5y; PDFs
download via plain HTTP.
"""
from .base import CompetitorDataScraper, PageSpec

_EXTRACT = r"""
() => {
  const YEAR_MIN = 2021;
  const KEEP = /universal registration|registration document|document d.enregistrement|\burd\b|annual report|half.?year|\bh1\b|interim report|results|slideshow|earnings|financial report/i;
  const DROP = /pension|trustee|\bsip\b|implementation statement|addendum|engagement|stewardship| voting|proxy|modern slavery|gender pay|\btcfd\b|\besg\b|sustainab|non.?financial|climate|green bond|diversity|\bsrep\b|pillar 3|\bsfdr\b|remuneration|by-?laws|articles of|code of conduct|whistlebl|liquidity contract/i;
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
    const group = /universal registration|registration document|\burd\b|annual report/.test(k) ? 'Annual'
                : /half.?year|\bh1\b|interim/.test(k) ? 'Quarterly'
                : /results|slideshow|earnings/.test(k) ? 'Earnings / Events' : 'Reports';
    let label = (t && t.length > 3) ? t : fn.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (y && !label.includes(String(y))) label = label + ' ' + y;
    out.push({ url: h, label: label.slice(0, 90), group });
  }
  return out;
}
"""

SCRAPER = CompetitorDataScraper(
    code="NAT",
    name="Natixis Investment Managers",
    notes="Natixis/Groupe BPCE financial-information hub (natixis.groupebpce.com); large noisy "
          "catalogue → keep URD/results/half-year only, drop pension/SREP/ESG noise; 5y; stdlib.",
    channel="chrome",
    pages=[PageSpec("https://natixis.groupebpce.com/about-us/financial-information/",
                    group="Reports", extract=_EXTRACT, settle=9000, scroll=14)],
)
