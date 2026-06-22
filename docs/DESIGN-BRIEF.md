# AM Compass — Design System Brief

> A complete, self-contained brief for designing the AM Compass design system. The reader is assumed to know **nothing** about this product or the asset-management industry — domain terms are explained inline. The goal of this document is to give a design partner everything needed to produce a proper, scalable design system (tokens, components, data-viz language, patterns, templates, states) that serves the product today and through its full roadmap.

---

## 1. What AM Compass is — in one paragraph

**AM Compass** ("Asset Management Compass") is a **competitive-intelligence and strategy cockpit for asset managers** — the firms that build and sell investment funds (e.g. BlackRock/iShares, Vanguard, State Street/SPDR, Amundi). It lets a fund issuer **monitor competitors' products, fees, holdings, documents and launches**, and — its signature capability — **reverse-engineer competitors' company and product strategy** from observable evidence. Think "Bloomberg-grade depth, but focused on competitive product/market strategy, and far more modern and self-serve." Every strategic conclusion the product draws is **traceable to a source signal** (no black box) — that auditability is a core product value and must be expressed in the design.

**It is NOT** a digital-marketing/SEO tool (not a Similarweb/Ahrefs clone). Web-traffic, search-ranking and ad-spend analytics are explicitly out of scope. The center of gravity is **products, portfolios, fees, performance, documents, flows, signals and strategy**.

---

## 2. The core idea behind the product (the mental model)

An asset manager is structurally a **catalogue retailer of financial products**. This analogy drives the whole product and should inform the design's information architecture:

| Retail concept | Asset-management equivalent | Plain meaning |
|---|---|---|
| Retailer / brand | Issuer / fund family | The company (BlackRock → iShares) |
| Product | Fund / ETF | The thing you buy |
| SKU / variant | Share class | A version of a fund (currency, fee, income style) |
| Barcode (GTIN) | ISIN | Unique 12-char product ID |
| Price tag | TER / fee | Annual % cost of owning the fund |
| Product page | Factsheet / KIID | The disclosure documents |
| Sales channel | Platform / broker / exchange | Where you buy it |
| Revenue / GMV | Net flows / AUM | Money gathered; total assets held |
| Customer | Investor | Retail person, advisor, or institution |

So the product is, in spirit, "competitive product intelligence for a catalogue retailer" — but the catalogue is funds, the specs are financial (returns, risk, fees, holdings), and the strategy questions are about where a competitor is expanding, retreating, cutting prices, or launching.

---

## 3. Domain vocabulary the design must speak correctly

The UI must use precise industry language. Key terms (the design system's labels, tooltips, and example content should use these correctly):

- **Issuer / fund family** — the company that runs the funds (BlackRock/iShares).
- **Product / fund / ETF** — an investable strategy. **ETF** = exchange-traded fund (trades like a stock). **Mutual fund / index fund** = bought/sold once a day. **SMA** (separately managed account), **model portfolio**, **CIT**, **direct indexing** = other "wrappers" — collectively the **vehicle spectrum**.
- **Share class** — a variant of one fund (e.g. USD vs EUR, accumulating vs distributing income, retail vs institutional fee tier).
- **ISIN / ticker** — product identifiers. ISIN is the global ID; ticker is the short exchange symbol.
- **TER / OCF** — Total Expense Ratio / Ongoing Charges — the annual fee, the headline "price." Quoted in % (e.g. 0.20%).
- **AUM** — Assets Under Management — total money in a fund (its "size"/popularity).
- **NAV** — Net Asset Value — the per-unit price, struck daily.
- **Flows / net new assets** — money coming in (or leaving, "redemptions/outflows") over a period. The "revenue" signal.
- **Benchmark / index** — the reference a fund tracks or is measured against (e.g. MSCI World, S&P 500).
- **Holdings** — the underlying securities a fund owns (its "bill of materials").
- **Return (1y/3y/5y)** — historical performance. **TWR** = time-weighted return, the standard method.
- **Risk metrics** — **volatility** (how bumpy), **Sharpe ratio** (return per unit of risk), **max drawdown** (worst peak-to-trough loss), **tracking difference/error** (how closely an index fund follows its benchmark).
- **Fixed income** = bonds. **Equity** = stocks. **Asset class** = the broad type (equity, fixed income, commodities, multi-asset).
- **Active vs passive** — manager-picked vs index-tracking. A major strategic axis.
- **ESG / SFDR** — sustainability classification (SFDR Articles 6/8/9 = rising sustainability tiers).
- **Domicile** — where a fund is legally registered (Ireland, Luxembourg). **UCITS** = the EU regulatory regime for retail funds.
- **NFO / launch · closure / liquidation · merger** — product lifecycle events.
- **Signal** — in AM Compass: a detected competitor event/change (a fee change, a launch, a holdings shift, an AUM trend).
- **Brief / dossier** — an AM Compass output: a synthesized strategy read about a competitor, with every claim cited to signals.

---

## 4. Who it's for (personas)

The product is a **professional B2B tool** used by sophisticated finance professionals at fund-issuing firms. They are analytical, data-fluent, time-pressed, and skeptical (they will not trust conclusions they can't verify). Desktop-first; often dual-monitor; comfortable with dense data (many already live in Bloomberg/Morningstar/Excel).

**Primary (v1):**
- **Product Strategy** — decides what funds to launch, in which exposure, at what fee. Wants: white-space/gaps, fee benchmarking, competitor positioning, launch/closure tracking, "where is the market moving."
- **ETF Capital Markets** — wants competitor launches, benchmark/index choice, flows by exposure, liquidity & listings. (Some capabilities here are later-phase.)

**Secondary / future:**
- **Competitive Intelligence / Strategy** teams — peer monitoring, league tables, "what is BlackRock doing right now."
- **Distribution / Sales** — channel & platform penetration, where flows are going.
- **Marketing** — brand & positioning (narrower role here than in a digital tool).
- **Executives** — high-level scorecards and briefings.

Design implication: the product must serve **both** the deep analyst (dense tables, drill-down, exports) **and** the executive skimmer (scorecards, one-line takeaways, briefings). Two reading altitudes in one system.

---

## 5. The two altitudes (a structural design requirement)

The product operates at two zoom levels; the IA and navigation must make both first-class and let users move between them:

1. **Market altitude (top-down):** "I'm considering entering **fixed income** — what's offered, who does what, where would my product sit, and **where is the market structurally moving** (e.g. money migrating from old-style mutual funds into ETFs and SMAs)?" → segment landscapes, who-does-what maps, offering inventories, white-space, positioning, migration/flow-direction.
2. **Competitor altitude (bottom-up):** "What is **BlackRock** doing — where are they expanding, cutting fees, launching, retreating?" → per-issuer dossiers, move timelines, inferred strategy with cited evidence.

---

## 6. Information architecture — current and full future

This is the full surface inventory the design system must eventually support. **v1 (built)** is marked; the rest is roadmap the system should scale to gracefully.

### Layer 0 — Data foundation (mostly behind the scenes, but needs admin/coverage UI)
- Issuer registry, product catalog (full vehicle spectrum), share-class explorer
- Identity/coverage management; **data-coverage map** (which issuers/segments have which data depth) — *v1 has a simple version*
- Document corpus browser (factsheets, KIIDs, prospectuses, holdings, annual reports)

### Layer 1 — Universe / lens builder
- **Lens selector**: choose what to compare by — Issuer · Index/benchmark · Category (asset class → region) · Market segment (style/factor/theme/risk/cost) · Exposure · Geography · Client segment
- **Peer-set builder** (define & save a competitive set); **watchlists**; saved views/projects

### Layer 2 — Monitoring & document intelligence
- Continuous competitor product monitoring
- **Document version-diff viewer** (show what changed between two versions of a factsheet/KIID/holdings file — the "before → after")
- Holdings-change tracker; news/regulatory feed; manager-commentary analysis

### Layer 3 — Comparison & analytics modules
- **Market Structure & Opportunity** — segment landscape, who-does-what, offering inventory, **entry white-space + positioning simulator** ("if I launch here, where do I sit?") *(v1 has a basic version)*
- **Product & Catalog** — side-by-side product compare; catalog gap; launch/closure/merger lifecycle
- **Pricing & Fee** — fee benchmarking; price positioning; fee-war tracking *(v1)*
- **Performance & Risk** — returns, Sharpe, drawdown, tracking difference, fixed-income & ESG views *(v1)*
- **Flows & Market-Share** — net flows, AUM league tables, share-of-flows *(future; needs licensed data)*
- **Holdings & Portfolio** — overlap, concentration, factor/sector exposure *(v1 has concentration)*
- **ETF Capital Markets** — listings/cross-listings, liquidity, spreads *(future)*
- **Distribution & Availability** — platform penetration, registrations *(future)*

### Layer 4 — Strategy reverse-engineering (the flagship)
- **Competitor strategy dossier** — inferred strategy (expanding/retreating/fee-strategy/distribution-push) with **evidence-cited claims** *(v1 built)*
- **Move timeline / playbook detection** — sequence of competitor actions over time
- **Structural-shift / migration view** — "where the market is moving" (vehicle migration, active→passive, etc.) *(future)*
- **Predictive / what-next** *(far future)*

### Layer 5 — Signals & alerts
- **Signal feed** (filterable list of detected events) *(v1 built)*
- Alerting/notifications on watchlists; anomaly detection

### Layer 6 — Cockpit, output & workspace
- **Issuer scorecards / dossiers** *(v1)*; **side-by-side compare** views
- **Dashboards** (composable), **scheduled briefings/reports**, **exports**
- Workspace: teams/roles, saved views, search/command palette, settings, API
- Auth, onboarding, account, billing (future)

---

## 7. Key user journeys (design for these end-to-end)

1. **"Scan a segment I might enter."** Pick lens → see segment landscape (size, players, offerings, fees, where money's moving) → spot white-space → simulate my product's positioning.
2. **"Reverse-engineer a competitor."** Open issuer dossier → read inferred strategy → drill each claim to its evidence signals → see the move timeline → export a briefing.
3. **"Monitor and get alerted."** Build a watchlist → receive signals (fee cut, launch, holdings drift) → triage the feed → open the detail/diff.
4. **"Compare head-to-head."** Select N products or issuers → side-by-side on fees/performance/risk/holdings.
5. **"Investigate a change."** A signal fires → open the document version-diff → see exactly what changed and the inferred meaning.

---

## 8. Content & data characteristics (drives the visual system)

The design system must excel at **dense, precise, trustworthy financial data**:

- **Tabular, numeric, comparative.** Many tables with tabular-figure numbers, %, currency (multi-currency), large counts. Needs first-class **data-table patterns**: sortable, sticky headers/columns, alignment, conditional coloring (above/below peer, gains/losses), compact and comfortable densities, row drill-down, column pinning, horizontal scroll for many peers.
- **Time series.** NAV/return/AUM histories → **line/area charts**; returns/flows by period → **bar charts**; "where money is moving" → **diverging bar / flow** visuals. Charts must read in both light and dark, be color-blind safe, and never rely on color alone.
- **Comparison.** Side-by-side of 2–N entities; "vs peer median" framing; rank/percentile.
- **Events & timelines.** Signals are dated events with types → **feed** and **timeline** patterns; type badges; confidence and detection-method tags.
- **Evidence-cited narrative.** Strategy briefs are prose where **every claim links to source signals** → an elegant **citation/evidence pattern** (inline chips that reveal/scroll-to the underlying signal; an "evidence index"). This is a signature interaction — make it beautiful and trustworthy.
- **Document diffs.** Before→after views of fee/holdings/text changes → a clean **diff pattern** (additions/removals, old→new).
- **Uncertainty & provenance.** Data confidence varies. The system must visually distinguish: **measured fact vs inferred conclusion** ("inferred, not stated"), **confidence levels** (high/medium/low), **estimated/directional vs precise**, and **data freshness/as-of dates**. This is critical for trust in a finance tool.
- **Coverage gaps.** Some competitors have rich data, many have only documents. The UI must gracefully show **partial coverage** ("structured data not available for this issuer yet") without feeling broken.

---

## 9. Component inventory the design system should deliver

Foundational + domain-specific components (with all states):

**Foundations:** color tokens (incl. semantic + data-viz ramps), typography scale (incl. tabular numerics + mono for IDs), spacing, radius, elevation, grid/layout, iconography, motion.

**Core UI:** app shell (top bar, primary nav, lens/context selector), tabs, buttons, inputs, selects, multi-select, search, **command palette**, chips/filters, badges/tags, tooltips, popovers, modals/drawers, toasts, pagination, breadcrumbs, segmented controls, skeleton loaders, empty/error states.

**Data & domain:**
- **Metric/stat cards** (label + big number + delta/trend)
- **Data tables** (the workhorse — many variants: peer comparison, holdings, league table; sticky/pinned, sortable, conditional formatting, density toggle, expandable rows, exportable)
- **Comparison view** (2–N entities side-by-side)
- **Charts**: line/area (time series), bar (periodic returns/flows), diverging bar (net flows by vehicle), small sparklines (in-table), donut (allocation), scatter (risk/return). A coherent **data-viz sub-system** with shared palette, axes, legends, tooltips, empty/loading states.
- **Signal feed item** + **timeline** (dated events, type badges, method/confidence tags, filterable)
- **Evidence/citation chip** + **evidence index** + claim-with-citations block
- **Document diff viewer** (before→after, add/remove)
- **Issuer/product scorecard / dossier** template
- **Lens / universe builder** (faceted selection, saved sets, watchlists)
- **Positioning/white-space visual** (where a product would sit vs the field)
- **Coverage/availability indicator** (data depth per issuer/segment)
- **Confidence / "inferred" markers**, **as-of/freshness badges**, **provenance/source link**
- **Alert/notification** components; **dashboard tile/grid**; **briefing/report** layout (print/export-friendly)

---

## 10. States, edge cases & labels to design

Every data surface needs: **loading** (skeletons), **empty** (no results / not in scope), **error**, **partial/coverage-limited**, **stale/as-of**, **estimated/directional** (explicitly labelled, visually distinct from precise data), **inferred vs measured**, **confidence: high/medium/low**, and **constructed/demo** (for example data). Numbers must format correctly per locale (decimal/thousands separators differ in EU) and per currency. Negative values, percentages, and basis points need consistent treatment.

---

## 11. Design principles (the values the system should embody)

1. **Evidence over black box.** Auditability is a product value, not an afterthought. Conclusions visibly link to evidence; provenance and as-of dates are always reachable. The design should *feel* trustworthy and verifiable.
2. **Density without clutter.** Power users want a lot on screen; the system must make dense data scannable through hierarchy, alignment, restraint, and tabular numerics — not by hiding everything behind clicks.
3. **Two altitudes, one system.** Support both the skim (scorecards, one-line takeaways) and the deep dive (tables, drill-down, raw signals) without two disjoint design languages.
4. **Calm, professional, modern.** This is a serious financial tool (credibility matters) but should feel markedly more modern and approachable than legacy terminals (Bloomberg/Morningstar). Confident, quiet, precise — not flashy, not toy-like.
5. **Speed & scannability.** Fast to parse; the most important number/takeaway is obvious; color and weight encode meaning consistently.
6. **Comparison-native.** The product is fundamentally about comparison; "vs peer / vs benchmark / vs prior" framing should be a first-class, reusable pattern.
7. **Honest about uncertainty.** Inferred ≠ measured; estimated ≠ precise; partial coverage is shown plainly. The design never overstates confidence.

---

## 12. Brand, name & tone

- **Name:** AM Compass — *Asset Management Compass*. The "compass" idea = orientation, direction, navigating a competitive landscape, "where is the market heading." A compass/navigation motif is a natural (but optional) brand anchor — use with restraint, avoid cliché.
- **Voice:** precise, analytical, confident, plain-spoken. Explains finance without dumbing down. Never hypey. Labels are concise and correct.
- **Tone in UI copy:** sentence case, no shouting, no exclamation. Numbers and evidence do the talking.

---

## 13. Visual direction — current starting point (to formalize/improve, not blindly keep)

A working skeleton already exists with a **dark "cockpit" aesthetic**: near-black background, dark panels with subtle borders, blue accent, green/red for gains/losses, amber for watch/attention, gray for neutral, tabular numerics, compact tables, pill badges, monospace for IDs. It reads as a professional financial cockpit. **Treat this as a directional starting point, not a constraint** — the design partner should elevate it into a real system and is free to propose a stronger direction (including a refined light mode).

**Hard requirements regardless of direction:**
- **Both dark and light themes** (token-driven, switchable). Many finance users prefer dark; some institutions mandate light/print.
- **Color-blind-safe** data-viz; never encode meaning by color alone (pair with shape/label/pattern).
- **Tabular/lining numerals** everywhere numbers align; a **monospace** for IDs/codes.
- **WCAG AA** contrast minimum.
- A **semantic color system**: positive/negative (gains/losses, in/out flows), attention/warning, info/accent, neutral — plus a distinct **categorical palette** for chart series and signal types that works in both themes.

---

## 14. Accessibility & internationalization

- WCAG 2.1 AA; full keyboard navigation (power users live on keyboard); visible focus; screen-reader-labelled tables/charts.
- **Multi-language** content (English + German at least; the underlying data is multilingual — German factsheets etc.). Layouts must tolerate longer strings.
- **Multi-currency & locale number/date formats** (EU decimal commas, $/€/£, basis points, DD-MMM-YYYY).
- Dense tables must remain accessible (proper semantics, not div soup).

---

## 15. Platform, scale & technical context (for the design partner)

- **Web app, desktop-first** (primary use is at a desk, often wide/dual monitors); tablet a plus; phone is read-only/triage at most (briefings, alerts).
- Current stack is **React + TypeScript** (Vite today; production stack still open). The design system should be delivered as **design tokens + component specs** that map cleanly to a React component library (and ideally a Figma library mirroring the components).
- **Performance at scale:** tables of hundreds/thousands of rows (holdings), large peer sets, long time series. Components must be designed with virtualization/density in mind.
- Theming via **tokens** (CSS variables) is required so dark/light and future white-label/theming are possible.

---

## 16. Reference points (what to learn from / avoid)

- **Bloomberg Terminal / Eikon** — density and information richness to aspire to; but **avoid** their dated, cramped, intimidating feel. Be the modern answer.
- **Morningstar Direct, Nasdaq eVestment** — the incumbent fund-analytics tools; functional but heavy/clunky. We win on clarity and self-serve UX.
- **Koyfin, YCharts** — praised for clean, fast, modern financial UX for a similar audience; good interaction references.
- **Linear, Vercel, Stripe dashboards** — for modern product polish, restraint, and dark-mode craft (general SaaS reference, not finance).
- **Ahrefs / Similarweb dashboards** — competitive-intelligence interaction patterns (comparison, share-of, trend), even though our domain differs.

---

## 17. The hard design challenges to solve (where the system earns its keep)

1. **Evidence/citation made elegant.** How a strategy claim shows its supporting signals — inline, hover, drill — so it feels trustworthy and is pleasant, not noisy.
2. **Inferred vs measured, and confidence.** A consistent visual language for "this is a conclusion, not a fact" and "high/medium/low confidence," used across briefs, signals, and metrics.
3. **Dense comparison that stays scannable.** N-way comparison tables/peer views that hold a lot yet remain instantly readable (vs-peer/vs-benchmark framing).
4. **"Where the market is moving."** Visualizing structural migration (money flowing between product types over time) intuitively.
5. **Document diffs.** Showing what changed in a factsheet/holdings/fee between versions, cleanly.
6. **Partial coverage without feeling broken.** Gracefully representing "rich data here, only documents there."
7. **Two altitudes in one nav.** Letting users move fluidly between market-level and competitor-level without a jarring context switch.
8. **The lens/universe builder.** Making "choose what to compare, by which axis, and save it" powerful but not intimidating.

---

## 18. What we'd like the design system to deliver

1. **Design tokens** — color (semantic + categorical + data-viz ramps, light & dark), typography (scale, tabular numerics, mono), spacing, radius, elevation, motion, breakpoints.
2. **Core component library** — every component in §9, with all states (§10), in light & dark, with accessibility specs.
3. **A data-visualization sub-system** — chart types, shared axes/legends/tooltips/empty states, palette, in-table sparklines, color-blind-safe rules.
4. **Signature patterns** — evidence/citation, signal-feed/timeline, comparison, document-diff, scorecard/dossier, confidence/uncertainty, coverage/provenance, lens/universe builder, positioning/white-space.
5. **Page/template layouts** — for each major surface in §6 (dashboard, dossier, comparison, signal feed, segment landscape, document diff, briefing/report, settings, onboarding/empty).
6. **Layout & grid system**, app-shell/navigation pattern (supporting the two altitudes), responsive behavior.
7. **Iconography** and **brand expression** (logo/wordmark direction, the compass motif used tastefully).
8. **Usage guidance** — density rules, number/locale formatting, do's/don'ts, voice & UI-copy guidelines.
9. **A Figma library** mirroring the component library, token-linked, ready for engineering hand-off to React.

---

## 19. Phasing (so the system scales, not over-builds)

- **Now (v1, built):** Market structure (peer table + coverage), Competitor dossier (cited claims + perf/risk), Signals feed — iShares/EU-UCITS, fixed income + equity. Prioritize nailing: data tables, metric cards, signal feed, evidence/citation, dossier, comparison, the dark theme.
- **Next:** more issuers/segments (multi-issuer market views), document-diff viewer, watchlists/alerts, dashboards & briefings, light theme, lens/universe builder.
- **Later:** flows/market-share (license-dependent), migration/structural-shift visuals, ETF capital-markets, distribution, predictive — plus account/auth/onboarding/billing and white-label theming.

Design the foundations and patterns now so the later surfaces slot into the same system without a redesign.

---

## 20. One-line summary for the design partner

> Design a **trustworthy, dense-but-calm, dark-and-light, desktop-first** design system for a **competitive-intelligence cockpit for asset managers** — one that makes **comparison, evidence-cited strategy, and detected signals** feel precise and verifiable, scales from a 3-view skeleton to a full multi-module platform, and reads as the **modern successor to Bloomberg/Morningstar** for fund product & strategy teams.
