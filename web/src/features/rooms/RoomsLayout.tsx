// Rooms route layout: portals the Rooms subnav into the subpanel slot and renders the
// active room page via <Outlet/>.
import { Outlet } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useSubpanelSlot } from '../../layout/AppShell'
import { RoomsSubnav } from './RoomsSubnav'

export function RoomsLayout() {
  const slot = useSubpanelSlot()
  return (
    <>
      {slot ? createPortal(<RoomsSubnav />, slot) : null}
      <Outlet />
    </>
  )
}
