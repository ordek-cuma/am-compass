# Compass Design System — living style guide

Self-contained preview pages for the Asset Management Compass design system. Each page consumes
the **same** production stylesheets the app ships (`tokens.css`, `base.css`), so the guide can never
drift from the app's rendered output.

These pages are the bundle pushed to Claude Design via `/design-sync` (the `DesignSync` tool). Each
page's first line carries a `<!-- @dsCard group="…" -->` marker that the Design System pane uses to
build its card index.

| Page | Group | Covers |
|---|---|---|
| `color.html` | Color | Surfaces, ink, teal/navy/blue/gold, semantic, chart palette + usage rules |
| `type.html` | Type | The Inter type scale (display → micro) |
| `components.html` | Components | Buttons, chips, badges, context fields, selects, segmented, room controls |
| `data.html` | Data | Stat cards, sortable table, availability dots + legend, format badges |
| `rooms.html` | Rooms | Filter bar, attachment rows, fact rows with status dots, section panels |

> `tokens.css` and `base.css` here are copies of `../src/styles/*`. Keep them in sync when tokens or
> base component CSS change (or re-run the copy step in the build).
