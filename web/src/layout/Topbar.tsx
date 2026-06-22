// Context bar (spec §3.1): context fields · global search · icon buttons · avatar.
// Hamburger + search button appear only on mobile (CSS-gated).
import { BrandTile } from '../components/icons'

const chev = (
  <svg width="11" height="11" viewBox="0 0 12 12">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
  </svg>
)

function CtxField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="ctx-field">
      <span className="lab">{label}</span>
      <span className={`val${mono ? ' mono' : ''}`}>{value}</span>
      {chev}
    </div>
  )
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="topbar">
      <button className="menu-btn ic-btn" onClick={onMenu} title="Menu" aria-label="Open menu">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <div className="brand-mini">
        <BrandTile size={21} />
        <span className="ff">Compass</span>
      </div>
      <div className="ctx">
        <CtxField label="Market" value="Global · Multi" />
        <CtxField label="Segment" value="All products" />
        <CtxField label="Period" value="FY25 · QTD" mono />
        <CtxField label="Scope" value="Project" />
      </div>
      <div className="spacer" style={{ flex: 1 }} />
      <button className="search-btn ic-btn" title="Search" aria-label="Search">
        <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <div className="searchbar">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="ph">Search markets, signals, reports…</span>
        <span className="kbd">⌘K</span>
      </div>
      <button className="ic-btn" title="What-if model" aria-label="What-if model">
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
          <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      <button className="ic-btn" title="Alerts" aria-label="Alerts">
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
          <path d="M9 2a4 4 0 014 4v3l1.5 2.5h-11L5 9V6a4 4 0 014-4zM7 14a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3" fill="none" />
        </svg>
      </button>
      <button className="ic-btn" title="Help" aria-label="Help">
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
          <path d="M7 7a2 2 0 113 1.7c-.6.4-1 .8-1 1.6M9 13h.01" stroke="currentColor" strokeWidth="1.3" fill="none" />
        </svg>
      </button>
      <div className="user">AN</div>
    </div>
  )
}
