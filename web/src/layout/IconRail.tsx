// Dark navy primary rail (spec §3.1). Brand tile + grouped module entries + pinned footer.
import { forwardRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BrandTile, Icon } from '../components/icons'
import { FOOT, MODULES } from './modules'

export const IconRail = forwardRef<HTMLElement>(function IconRail(_props, ref) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Group modules in rail order, preserving group separators.
  const groups: { group: string; items: typeof MODULES }[] = []
  for (const m of MODULES) {
    const last = groups[groups.length - 1]
    if (last && last.group === m.group) last.items.push(m)
    else groups.push({ group: m.group, items: [m] })
  }

  const isActive = (v: string) => v === 'rooms' && pathname.startsWith('/rooms')

  return (
    <nav className="iconrail" ref={ref}>
      <div className="ir-brand">
        <BrandTile size={30} />
      </div>
      {groups.map((g) => (
        <div className="ir-grp" key={g.group}>
          {g.items.map((m) => (
            <a
              key={m.v}
              className={`ir-item${isActive(m.v) ? ' on' : ''}`}
              onClick={() => navigate(m.to)}
            >
              <span className="ir-ic">
                <Icon name={m.icon} />
              </span>
              <span className="ir-lab">{m.tab}</span>
              {m.badge ? <span className={`ir-badge${m.gold ? ' gold' : ''}`}>{m.badge}</span> : null}
            </a>
          ))}
        </div>
      ))}
      <div className="ir-foot">
        {FOOT.map((f) => (
          <a key={f.v} className="ir-item" title={`${f.name} · coming soon`}>
            <span className="ir-ic">
              <Icon name={f.icon} />
            </span>
            <span className="ir-lab">{f.tab}</span>
          </a>
        ))}
      </div>
    </nav>
  )
})
