// Settings route layout: portals the Settings subnav into the subpanel slot and renders the
// active settings page via <Outlet/>. Mirrors RoomsLayout.
import { Outlet } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useSubpanelSlot } from '../../layout/AppShell'
import { SettingsSubnav } from './SettingsSubnav'

export function SettingsLayout() {
  const slot = useSubpanelSlot()
  return (
    <>
      {slot ? createPortal(<SettingsSubnav />, slot) : null}
      <Outlet />
    </>
  )
}
