// Three-region responsive shell (spec §3): icon rail · resizable subpanel · topbar/main.
// Route content goes in <main>; route-specific subpanel content is portaled into the
// subpanel slot (see useSubpanelSlot).
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { IconRail } from './IconRail'
import { Topbar } from './Topbar'
import { Subpanel } from './Subpanel'
import { Drawer } from './Drawer'

const SP_MIN = 208
const SP_MAX = 380
const SP_DEFAULT = 250

const SubpanelSlotContext = createContext<HTMLElement | null>(null)
export const useSubpanelSlot = () => useContext(SubpanelSlotContext)

export function AppShell() {
  const appRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLElement>(null)
  const [spSlot, setSpSlot] = useState<HTMLElement | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const resizing = useRef(false)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  // Escape closes the drawer (preview modal handles its own Escape, capture-phase first).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  // --- subpanel resize (drag handle, clamped) ---
  const setSP = (px: number) =>
    appRef.current?.style.setProperty('--sp-w', `${Math.max(SP_MIN, Math.min(SP_MAX, px))}px`)

  const onResizeDown = (e: React.PointerEvent) => {
    resizing.current = true
    appRef.current?.classList.add('resizing')
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizing.current) return
    const irw = railRef.current?.getBoundingClientRect().width ?? 0
    setSP(e.clientX - irw)
  }
  const onResizeEnd = (e: React.PointerEvent) => {
    if (!resizing.current) return
    resizing.current = false
    appRef.current?.classList.remove('resizing')
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
  }
  const onResizeReset = () => appRef.current?.style.setProperty('--sp-w', `${SP_DEFAULT}px`)

  return (
    <SubpanelSlotContext.Provider value={spSlot}>
      <div className="app" ref={appRef}>
        <Topbar onMenu={() => setDrawerOpen(true)} />
        <IconRail ref={railRef} />
        <Subpanel
          slotRef={setSpSlot}
          onResizeDown={onResizeDown}
          onResizeMove={onResizeMove}
          onResizeEnd={onResizeEnd}
          onResizeReset={onResizeReset}
        />
        <Drawer open={drawerOpen} onClose={closeDrawer} />
        <div className={`scrim${drawerOpen ? ' show' : ''}`} onClick={closeDrawer} />
        <main className="main">
          <Outlet />
        </main>
      </div>
    </SubpanelSlotContext.Provider>
  )
}
