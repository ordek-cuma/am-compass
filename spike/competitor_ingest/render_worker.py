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
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile

_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
       "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")


def _grab(pg, url: str, dest: str) -> bool:
    """Navigate to the doc and capture the download. The browser is configured to download
    PDFs (always_open_pdf_externally) so both attachment docs (Goldman) and inline ones
    (T. Rowe static-files) fire a download event."""
    try:
        with pg.expect_download(timeout=40000) as dl:
            try:
                pg.goto(url, wait_until="commit", timeout=30000)
            except Exception:
                pass  # navigation aborts when the download starts — expected
        dl.value.save_as(dest)
        return True
    except Exception:
        return False


def _download_mode(spec: dict) -> None:
    """Download docs whose assets are bot-protected (Akamai) or served inline, via a real
    in-session browser that downloads PDFs instead of rendering them. spec: {warmup, out_dir,
    channel?, targets?|extract?, skip_ids?}. Prints [{url,label,group,file}]."""
    try:
        from playwright.sync_api import sync_playwright
    except Exception as e:
        print(json.dumps({"error": f"playwright unavailable: {e}"}))
        return
    out_dir = spec["out_dir"]
    os.makedirs(out_dir, exist_ok=True)
    skip = set(spec.get("skip_ids") or [])
    # A persistent profile that downloads PDFs (instead of opening Chrome's inline viewer),
    # so the navigation fires a real download event we can capture.
    udd = tempfile.mkdtemp(prefix="ci-dl-")
    os.makedirs(os.path.join(udd, "Default"), exist_ok=True)
    with open(os.path.join(udd, "Default", "Preferences"), "w") as f:
        json.dump({"plugins": {"always_open_pdf_externally": True}}, f)
    results: list[dict] = []
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            udd, headless=True, channel=(spec.get("channel") or None), accept_downloads=True,
            user_agent=_UA, locale="en-US", viewport={"width": 1366, "height": 900},
            args=["--disable-blink-features=AutomationControlled"])
        pg = ctx.pages[0] if ctx.pages else ctx.new_page()
        if spec.get("warmup"):
            try:
                pg.goto(spec["warmup"], wait_until="commit", timeout=40000)
                pg.wait_for_timeout(8000)
            except Exception as e:
                print(f"warmup: {e}", file=sys.stderr)
        targets = spec.get("targets") or []
        if spec.get("extract"):  # discover targets in-session from the warmed page
            try:
                for _ in range(8):
                    pg.mouse.wheel(0, 2500)
                    pg.wait_for_timeout(400)
                targets = pg.evaluate(spec["extract"]) or []
            except Exception as e:
                print(f"discover: {e}", file=sys.stderr)
        for t in targets:
            url = t["url"]
            doc_id = "w" + hashlib.sha256(url.encode()).hexdigest()[:16]
            if doc_id in skip:
                continue
            dest = os.path.join(out_dir, f"{doc_id}.pdf")
            if _grab(pg, url, dest):
                results.append({"url": url, "label": t.get("label", ""), "group": t.get("group", "Reports"), "file": dest})
            else:
                print(f"grab failed: {url[-46:]}", file=sys.stderr)
        ctx.close()
    shutil.rmtree(udd, ignore_errors=True)
    print(json.dumps(results))
_COOKIE_LABELS = ("Accept all", "Accept All Cookies", "Accept", "I agree", "Agree",
                  "Tout accepter", "Allow all", "Got it", "OK")


def main() -> None:
    try:
        spec = json.load(sys.stdin)
    except Exception as e:
        print(json.dumps({"error": f"bad spec: {e}"}))
        return
    if spec.get("mode") == "download":
        return _download_mode(spec)
    try:
        from playwright.sync_api import sync_playwright
    except Exception as e:
        print(json.dumps({"error": f"playwright unavailable: {e}"}))
        return

    out: list[dict] = []
    seen: set[str] = set()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel=(spec.get("channel") or None),
                                    args=["--disable-blink-features=AutomationControlled"])
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
            click_each = sp.get("click_each")
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
                for _ in range(scroll):  # scroll first so lazy-loaded lists are present
                    page.mouse.wheel(0, 5000)
                    page.wait_for_timeout(400)
                if extract:
                    try:
                        return page.evaluate(extract)
                    except Exception as e:
                        print(f"extract {url}: {e}", file=sys.stderr)
                        return []
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
                    out.append({"label": label[:110] or "Document", "url": u,
                                "group": it.get("group") or group, "id": it.get("id")})

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
                        try:  # set value + dispatch change via JS — robust for hidden/custom selects
                            page.eval_on_selector(
                                iterate, "(el, val) => { el.value = val; "
                                "el.dispatchEvent(new Event('change', {bubbles: true})); }", v)
                            page.wait_for_timeout(settle)
                        except Exception as e:
                            print(f"select {iterate}={v}: {e}", file=sys.stderr)
                            continue
                    collect(harvest())
            elif click_each:  # click each distinct visible filter button (e.g. year tabs)
                try:
                    texts = page.eval_on_selector_all(
                        click_each, "els => [...new Set(els.filter(e => e.offsetParent !== null)"
                        ".map(e => (e.innerText || '').trim()))].filter(Boolean)")
                except Exception:
                    texts = []
                if iterate_limit:
                    texts = texts[:iterate_limit]
                for txt in (texts or []):
                    try:
                        page.locator(f"{click_each}:visible", has_text=txt).first.click(timeout=4000)
                        page.wait_for_timeout(settle)
                    except Exception as e:
                        print(f"click {txt}: {str(e)[:40]}", file=sys.stderr)
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
