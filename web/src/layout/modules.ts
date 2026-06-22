// Icon-rail navigation model. Per the current sprint, ONLY Rooms is exposed in the rail;
// the remaining spec modules (Overview, Diligence, Reports, Pivot, …) are added here as
// they get built. Footer holds the pinned utilities.
import type { IconName } from '../components/icons'

export interface ModuleDef {
  v: string
  name: string
  tab: string
  icon: IconName
  group: string
  to: string
  badge?: string
  gold?: boolean
}

export const MODULES: ModuleDef[] = [
  { v: 'rooms', name: 'Rooms', tab: 'Rooms', icon: 'vault', group: 'Workspace', to: '/rooms/product' },
]

export const FOOT: { v: string; name: string; tab: string; icon: IconName }[] = [
  { v: 'design', name: 'Design System', tab: 'Design', icon: 'palette' },
  { v: 'settings', name: 'Settings', tab: 'Settings', icon: 'gear' },
]
