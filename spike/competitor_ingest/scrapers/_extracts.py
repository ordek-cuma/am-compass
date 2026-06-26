"""Shared extractor JS for the "labeled PDF" IR pages — annual-report / proxy listing pages
where each document is a PDF (or cloudfront/static-file) link whose year + type are in the
link text or filename. Used by several EDGAR-firm scrapers (Invesco, Janus Henderson, PGIM,
AMG, …). Year cap and grouping are derived from the label/filename.
"""

NAMED_PDF = r"""
() => {
  const YEAR_MIN = 2021;
  const out = [], seen = new Set();
  for (const a of document.querySelectorAll('a[href]')) {
    const h = a.href, low = h.toLowerCase();
    if (!/\.pdf|cloudfront|static-files|\/dam\//.test(low)) continue;
    if (/cookie|slavery|privacy|\/terms|covid/.test(low)) continue;   // footer/nav noise
    let t = (a.innerText || a.getAttribute('aria-label') || a.getAttribute('title') || '')
              .replace(/\s+/g, ' ').replace(/\(opens? in (a )?new (tab|window)\)|\(pdf\)|download pdf|pdf format download/ig, '')
              .replace(/\s+/g, ' ').trim();
    const fn = decodeURIComponent((h.split('/').pop() || '').split('?')[0]);
    const m = (t + ' ' + fn).match(/(20[0-3]\d)/);   // no word boundary — years embed in filenames (proxy2026, AR2025)
    const y = m ? +m[1] : null;
    if (!y || y < YEAR_MIN) continue;
    if (seen.has(h)) continue;
    seen.add(h);
    const k = (t + ' ' + fn).toLowerCase();
    const group = /proxy/.test(k) ? 'Proxy'
                : /annual.?report|annual_report|10-?k|\bar20/.test(k) ? 'Annual'
                : /voting|statement of financial|financial statement/.test(k) ? 'Reports'
                : 'Reports';
    let label = (t && t.length > 3 && !/^pdf$/i.test(t)) ? t
              : fn.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    out.push({ url: h, label: (label || 'Document').slice(0, 80), group });
  }
  return out;
}
"""
