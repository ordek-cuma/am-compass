"""Headless-render worker — discovers document links on JS-rendered IR sites that a plain
HTTP GET can't see (the docs are injected client-side, often via a DMS like Amundi's Nuxeo).

Runs under spike/.venv (Playwright + headless Chromium), invoked as a SUBPROCESS by the
stdlib crawler so the core stays dependency-free:

    .venv/bin/python -m competitor_ingest.render_worker   # spec JSON on stdin

Reads {"pages": [{url, selector, label_attr, group, scroll}]} from stdin and prints a JSON
list of {label, url, group} on stdout. Download stays in web.py (stdlib urllib) — only
discovery needs the browser. Setup: see requirements-render.txt.
"""
import json
import re
import sys


def main() -> None:
    try:
        spec = json.load(sys.stdin)
    except Exception as e:
        print(json.dumps({"error": f"bad spec: {e}"}))
        return
    try:
        from playwright.sync_api import sync_playwright
    except Exception as e:
        print(json.dumps({"error": f"playwright unavailable: {e}"}))
        return

    out: list[dict] = []
    seen: set[str] = set()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        for spec_page in spec.get("pages", []):
            url = spec_page["url"]
            selector = spec_page.get("selector", "a[href]")
            group = spec_page.get("group", "Reports")
            attr = spec_page.get("label_attr", "aria-label")
            scroll = int(spec_page.get("scroll", 8))
            try:
                page.goto(url, wait_until="networkidle", timeout=45000)
            except Exception as e:
                print(f"goto {url}: {e}", file=sys.stderr)
                continue
            page.wait_for_timeout(1200)
            for label in ("Accept all", "Accept All Cookies", "Accept", "I agree", "Agree",
                          "Tout accepter", "Allow all", "Got it", "OK"):  # dismiss consent gates
                try:
                    page.click(f"button:has-text('{label}')", timeout=1200)
                    page.wait_for_timeout(700)
                    break
                except Exception:
                    pass
            for _ in range(scroll):  # trigger lazy-loaded document lists
                page.mouse.wheel(0, 5000)
                page.wait_for_timeout(600)
            page.wait_for_timeout(1000)
            js = ("els => els.map(e => ({url: e.href, label: (e.getAttribute('%s') || "
                  "e.getAttribute('title') || e.innerText || '').trim()}))") % attr
            try:
                items = page.eval_on_selector_all(selector, js)
            except Exception as e:
                print(f"select {url}: {e}", file=sys.stderr)
                continue
            for it in items:
                u = it.get("url")
                if not u or u in seen:
                    continue
                seen.add(u)
                label = re.sub(r"\s+", " ", it.get("label", "")).strip()
                label = re.sub(r"^(t[ée]l[ée]charger|download)\s*", "", label, flags=re.I).strip(" -·")
                out.append({"label": label[:110] or "Document", "url": u, "group": group})
        browser.close()
    print(json.dumps(out))


if __name__ == "__main__":
    main()
