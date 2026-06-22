# Compass — web app

The **Asset Management Compass** cockpit: a light, Aladdin-compatible, back-office
market-intelligence UI. This sprint ships the responsive app shell and the full
**Rooms** module (Product + Company data rooms). Other spec modules are deferred.

Stack: **Vite + React + react-router + TypeScript**. Token-driven design system
(`src/styles/tokens.css` + `base.css`); a living style-guide bundle lives in
[`design-system/`](design-system/).

## Run it locally

Prerequisites: **Node 18+** (developed on Node 22) and npm.

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:5173**. The app lands on the Product Data Room.

| Script | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server (HMR) on :5173 |
| `npm run build` | Type-check (`tsc --noEmit`) then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check only |

## Routes

| URL | View |
|---|---|
| `/` → `/rooms/product` | Product Data Room (fund screener) |
| `/rooms/product/:fundId` | Fund detail — 6 tabs (overview / classes / listings / holdings / measures / docs) |
| `/rooms/company` | Company Data Room (document screener) |
| `/rooms/company/:companyId` | Company detail |

## Project layout

```
src/
  styles/        tokens.css (design tokens) + base.css (ported for parity)
  components/    Icon, Panel, ModuleHeader, facts (MetaRow/StatCard/AttachList), ui-context (preview modal + toast)
  layout/        AppShell (3-region grid + resize + drawer), IconRail, Subpanel, Topbar, Drawer, modules
  data/          types.ts, funds.ts (FUNDS), companies.ts (COMPANIES)  ← sample data; swap point for real data
  features/rooms/ RoomsLayout, ProductScreener, FundDetail (+FundPanels), CompanyScreener, CompanyDetail
design-system/   @dsCard style-guide pages (for /design-sync)
```

## Data

Screens read **only** from `src/data/funds.ts` (`FUNDS`) and `src/data/companies.ts`
(`COMPANIES`), typed by `src/data/types.ts`. Replacing the sample arrays with real
data (export JSON, the `spike/` crawl, or a fetch) does not touch any UI code. The
status-dot availability model (`have` / `partial` / `add`) already drives the detail
pages, so real field coverage will surface automatically.
