// Module header band (spec §3): breadcrumb · title · description · right-slot actions.
import type { ReactNode } from 'react'

export function ModuleHeader({
  crumb,
  title,
  sub,
  actions,
}: {
  crumb: ReactNode
  title: ReactNode
  sub: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mhead">
      <div className="crumb">{crumb}</div>
      <div className="mhead-row">
        <div className="mhead-titles">
          <div className="mtitle">{title}</div>
          <div className="msub">{sub}</div>
        </div>
        {actions ? <div className="mactions">{actions}</div> : null}
      </div>
    </div>
  )
}
