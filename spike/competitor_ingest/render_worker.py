"""Headless-render worker — discovers document links on JS-rendered IR sites that a plain
HTTP GET can't see (the docs are injected client-side, often via a DMS or a q4cdn widget).

Runs under spike/.venv (Playwright + headless Chromium), invoked as a SUBPROCESS by the
stdlib crawler so the core stays dependency-free:

    .venv/bin/python -m competitor_ingest.render_worker   # spec JSON on stdin

Reads {"pages": [PageSpec…]} from stdin and prints a JSON list of {label, url, group} on
stdout. Per page it supports: a fallback selector+attr harvest, a custom `extract` JS (for
rich per-row labels), iterating a `<select>` (e.g. a year filter) and harvesting after each
option, an `exclude` regex, lazy-load scrolling, and a settle wait. A realistic browser
profile (real UA / viewport / launch arg) lets managed bot-challenges clear on their own —
we never solve a challenge. Download stays in web.py (stdlib). Setup: requirements-render.txt.
"""
import json
import re
import sys

_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
       "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
_COOKIE_LABELS = ("Accept all", "Accept All Cookies", "Accept", "I agree", "Agree",
                  "Tout accepter", "Allow all", "Got it", "OK")


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
        browser = p.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled"])
        ctx = browser.new_context(user_agent=_UA, locale="en-US", viewport={"width": 1366, "height": 900})
        page = ctx.new_page()
        for sp in spec.get("pages", []):
            url = sp["url"]
            group = sp.get("group", "Reports")
            settle = int(sp.get("settle", 4000))
            selector = sp.get("selector", "a[href]")
            attr = sp.get("label_attr", "aria-label")
            scroll = int(sp.get("scroll", 8))
            iterate = sp.get("iterate_select")
            iterate_limit = sp.get("iterate_limit")
            load_more = sp.get("load_more")
            extract = sp.get("extract")
            follow = re.compile(sp["follow"]) if sp.get("follow") else None
            follow_selector = sp.get("follow_selector", "a[href$='.pdf']")
            exclude = re.compile(sp["exclude"]) if sp.get("exclude") else None
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=45000)
            except Exception as e:
                print(f"goto {url}: {e}", file=sys.stderr)
                continue
            page.wait_for_timeout(settle)  # let JS render / managed challenge clear
            for label in _COOKIE_LABELS:
                try:
                    page.click(f"button:has-text('{label}')", timeout=1000)
                    page.wait_for_timeout(600)
                    break
                except Exception:
                    pass

            def expand() -> None:  # click a "load more" button until it's gone / stops growing
                count_sel = selector if not extract else "a[href]"
                stable = last = -1
                for _ in range(80):
                    try:
                        btn = page.query_selector(load_more)
                    except Exception:
                        btn = None
                    if not btn or not btn.is_visible():
                        break
                    try:
                        btn.scroll_into_view_if_needed()
                        btn.click(timeout=4000)
                    except Exception:
                        break
                    page.wait_for_timeout(settle)
                    n = len(page.eval_on_selector_all(count_sel, "els => els.map(e => e.href)"))
                    if n <= last:
                        stable += 1
                        if stable >= 1:
                            break
                    else:
                        stable = 0
                    last = n

            def harvest() -> list[dict]:
                if extract:
                    try:
                        return page.evaluate(extract)
                    except Exception as e:
                        print(f"extract {url}: {e}", file=sys.stderr)
                        return []
                for _ in range(scroll):
                    page.mouse.wheel(0, 5000)
                    page.wait_for_timeout(500)
                js = ("els => els.map(e => ({url: e.href, label: (e.getAttribute('%s') || "
                      "e.getAttribute('title') || e.innerText || '').trim()}))") % attr
                try:
                    return page.eval_on_selector_all(selector, js)
                except Exception as e:
                    print(f"select {url}: {e}", file=sys.stderr)
                    return []

            def collect(items: list[dict]) -> None:
                for it in items or []:
                    u = it.get("url")
                    if not u or u in seen:
                        continue
                    label = re.sub(r"\s+", " ", it.get("label", "")).strip()
                    label = re.sub(r"^(t[ée]l[ée]charger|download)\s*", "", label, flags=re.I).strip(" -·")
                    if exclude and exclude.search(label):
                        continue
                    seen.add(u)
                    out.append({"label": label[:110] or "Document", "url": u, "group": it.get("group") or group})

            def follow_subpages(raw: list[dict]) -> None:
                """Direct-PDF items are kept; sub-page items matching `follow` are visited and
                their first matching PDF is harvested (carrying the sub-page's label/group)."""
                for it in raw or []:
                    u = it.get("url", "")
                    if u.lower().split("?")[0].endswith(".pdf"):
                        collect([it])
                    elif follow.search(u):
                        try:
                            page.goto(u, wait_until="domcontentloaded", timeout=40000)
                            page.wait_for_timeout(settle)
                            purls = page.eval_on_selector_all(follow_selector, "els => els.map(e => e.href)")
                        except Exception as e:
                            print(f"follow {u}: {e}", file=sys.stderr)
                            purls = []
                        if purls:
                            collect([{"url": purls[0], "label": it.get("label", ""), "group": it.get("group")}])
                    # else: a sub-page with no document (e.g. HTML-only) → skipped

            if iterate:
                try:
                    values = page.eval_on_selector_all(f"{iterate} option", "els => els.map(o => o.value).filter(Boolean)")
                except Exception:
                    values = []
                if iterate_limit:
                    values = values[:iterate_limit]  # options are newest-first → last N years
                for v in (values or [None]):
                    if v is not None:
                        try:
                            page.select_option(iterate, v)
                            page.wait_for_timeout(settle)
                        except Exception as e:
                            print(f"select_option {iterate}={v}: {e}", file=sys.stderr)
                            continue
                    collect(harvest())
            else:
                if load_more:
                    expand()
                if follow:
                    follow_subpages(harvest())
                else:
                    collect(harvest())
        browser.close()
    print(json.dumps(out))


if __name__ == "__main__":
    main()
