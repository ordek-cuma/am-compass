// Inline-SVG icon system ported from the reference build.
// Geometric outline, currentColor, no emoji. The path map drives nav + table glyphs;
// named components cover the one-off chrome glyphs.

const PATHS: Record<string, string> = {
  home: '<path d="M3 8l6-5 6 5v7a1 1 0 01-1 1h-3v-4H7v4H4a1 1 0 01-1-1z" stroke="currentColor" stroke-width="1.3" fill="none"/>',
  vault: '<rect x="2.5" y="3" width="13" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3" fill="none"/><circle cx="9" cy="9" r="2.4" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M9 5v1M9 12v1" stroke="currentColor" stroke-width="1.3"/>',
  docs: '<rect x="3" y="2.5" width="9" height="13" rx="1.3" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5.5 6h4M5.5 9h4M5.5 12h2.5" stroke="currentColor" stroke-width="1.2"/>',
  pivot: '<rect x="2.5" y="2.5" width="13" height="13" rx="1.5" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M2.5 6.5h13M6.5 6.5v9" stroke="currentColor" stroke-width="1.2"/>',
  grid9: '<rect x="2.5" y="2.5" width="13" height="13" rx="1.5" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M7 2.5v13M11 2.5v13M2.5 7h13M2.5 11h13" stroke="currentColor" stroke-width="1"/>',
  target: '<circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.3" fill="none"/><circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.3" fill="none"/><circle cx="9" cy="9" r=".6" fill="currentColor"/>',
  swords: '<path d="M3 3l6 6M13 13l-2-2M11 11l4 4M15 3l-6 6M5 13l2-2" stroke="currentColor" stroke-width="1.3" fill="none"/>',
  signal: '<path d="M9 14V8M5 14v-3M13 14V5M3 16h12" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  catalog: '<path d="M3 4.5C3 3.7 4.8 3 7 3s4 .7 4 1.5M3 4.5v8C3 13.3 4.8 14 7 14s4-.7 4-1.5v-8M3 8.5C3 9.3 4.8 10 7 10s4-.7 4-1.5" stroke="currentColor" stroke-width="1.3" fill="none"/>',
  shield: '<path d="M9 2l5 2v4c0 4-2.5 6.5-5 8-2.5-1.5-5-4-5-8V4z" stroke="currentColor" stroke-width="1.3" fill="none"/>',
  palette: '<path d="M9 2.5a6.5 6.5 0 100 13c.8 0 1.3-.6 1.3-1.3 0-.4-.2-.7-.4-1-.2-.2-.4-.6-.4-1 0-.7.6-1.2 1.3-1.2H12a3.5 3.5 0 003.5-3.5C15.5 4.6 12.6 2.5 9 2.5z" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="6" cy="7.5" r=".9" fill="currentColor"/><circle cx="9" cy="6" r=".9" fill="currentColor"/><circle cx="11.7" cy="7.6" r=".9" fill="currentColor"/>',
  gear: '<circle cx="9" cy="9" r="2.3" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M9 2.5v2M9 13.5v2M15.5 9h-2M4.5 9h-2M13.6 4.4l-1.4 1.4M5.8 12.2l-1.4 1.4M13.6 13.6l-1.4-1.4M5.8 5.8L4.4 4.4" stroke="currentColor" stroke-width="1.2"/>',
  dilig: '<rect x="3" y="2.5" width="9" height="13" rx="1.3" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5.5 6h4M5.5 8.5h2.2" stroke="currentColor" stroke-width="1.2"/><circle cx="10.5" cy="11" r="2.4" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M12.3 12.8L14.5 15" stroke="currentColor" stroke-width="1.4"/>',
  building: '<rect x="3.5" y="2.5" width="11" height="13" rx="1" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M6 5.5h2M10 5.5h2M6 8h2M10 8h2M6 10.5h2M10 10.5h2M8 15.5v-3h2v3" stroke="currentColor" stroke-width="1.1"/>',
  box: '<path d="M9 2.5l5.5 3v6L9 14.5 3.5 11.5v-6z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/><path d="M3.5 5.5L9 8.5l5.5-3M9 8.5v6" stroke="currentColor" stroke-width="1.2" fill="none"/>',
  file: '<path d="M4 2.5h5l3 3v10a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-13a.5.5 0 01.5-.5z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M9 2.5v3h3" stroke="currentColor" stroke-width="1.2" fill="none"/>',
  dl: '<path d="M9 3v8M5.5 7.5L9 11l3.5-3.5M4 14h10" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
}

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      dangerouslySetInnerHTML={{ __html: PATHS[name] || '' }}
    />
  )
}

// ---- named one-off glyphs ----
export const MagIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width={14} height={14}>
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const DlIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" style={{ width: 15, height: 15 }}>
    <path d="M8 2v8M5 7.5L8 10.5l3-3M3.5 13h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const BackIcon = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M9.5 3.5L5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

export const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.4" />
  </svg>
)

export const ChevIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
  </svg>
)

export const FileMiniIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
    <path d="M3 1.5h4l3 3v7.5a.5.5 0 01-.5.5H3.5a.5.5 0 01-.5-.5V2a.5.5 0 010-.5z" stroke="currentColor" strokeWidth="1.1" />
  </svg>
)

// Brand "a" tile — constant across all surfaces.
export function BrandTile({ size = 30 }: { size?: number }) {
  return (
    <svg className="glyph mark" viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }}>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6.6" fill="#0E9A88" />
      <path d="M5.6 3.4h12.8" stroke="rgba(255,255,255,.22)" strokeWidth="1.1" strokeLinecap="round" />
      <text x="12" y="17.4" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="15.5" fill="#fff">a</text>
    </svg>
  )
}
