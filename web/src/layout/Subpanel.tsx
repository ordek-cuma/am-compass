// Contextual, resizable secondary panel (spec §3.1). The wordmark + workspace switcher are
// constant; the body (#spBody equivalent) is a portal slot filled by the active route.
import { ChevIcon } from '../components/icons'

interface SubpanelProps {
  slotRef: (el: HTMLElement | null) => void
  onResizeDown: (e: React.PointerEvent) => void
  onResizeMove: (e: React.PointerEvent) => void
  onResizeEnd: (e: React.PointerEvent) => void
  onResizeReset: () => void
}

export function Subpanel({ slotRef, onResizeDown, onResizeMove, onResizeEnd, onResizeReset }: SubpanelProps) {
  return (
    <aside className="subpanel">
      <div className="sp-brand">
        <div className="wm">Compass</div>
        <div className="sfx">Asset Management</div>
      </div>
      <div className="sp-scroll">
        <div className="ws-switch">
          <span className="dot" />
          <div>
            <div className="nm">EMEA Coverage</div>
            <div className="ty">workspace · project</div>
          </div>
          <span className="chev">
            <ChevIcon />
          </span>
        </div>
        <div className="sp-body" ref={slotRef} />
      </div>
      <div
        className="sp-resize"
        title="Drag to resize · double-click to reset"
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        onPointerCancel={onResizeEnd}
        onDoubleClick={onResizeReset}
      />
    </aside>
  )
}
