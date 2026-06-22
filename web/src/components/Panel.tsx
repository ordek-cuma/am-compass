// Card container (spec §5.7). title may include a <span className="muted2"> caption.
import type { CSSProperties, ReactNode } from 'react'
import type { IconName } from './icons'
import { Icon } from './icons'

export function Panel({
  title,
  action,
  children,
  bodyStyle,
}: {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  bodyStyle?: CSSProperties
}) {
  return (
    <div className="panel">
      <div className="panel-h">
        <span className="t">{title}</span>
        {action ? <span className="tools">{action}</span> : null}
      </div>
      <div className="panel-b" style={bodyStyle}>
        {children}
      </div>
    </div>
  )
}

// Empty-state (spec §5.19).
export function Empty({ title, desc, icon }: { title: string; desc: string; icon: IconName }) {
  return (
    <div className="empty">
      <div className="ico">
        <Icon name={icon} size={21} />
      </div>
      <div className="et">{title}</div>
      <div className="ed">{desc}</div>
    </div>
  )
}
