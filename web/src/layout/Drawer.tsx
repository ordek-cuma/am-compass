// Mobile drawer (≤1024px) — folds both nav tiers. Shows the module list (Rooms) plus the
// two data-room destinations so rooms stay switchable without the subpanel.
import { useLocation, useNavigate } from 'react-router-dom'
import { BrandTile, Icon } from '../components/icons'
import { COMPETITORS } from '../data/competitors'
import { FUNDS } from '../data/funds'
import { FOOT, MODULES } from './modules'

export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const go = (to: string) => {
    navigate(to)
    onClose()
  }

  return (
    <nav className={`drawer${open ? ' open' : ''}`}>
      <div className="drawer-head">
        <BrandTile size={23} />
        <span className="ff" style={{ fontSize: 17, fontWeight: 600 }}>
          Compass
        </span>
        <button className="ic-btn" onClick={onClose} aria-label="Close menu" style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.7)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      <div className="ws-switch" style={{ margin: '10px 12px' }}>
        <span className="dot" />
        <div>
          <div className="nm">EMEA Coverage</div>
          <div className="ty">workspace · project</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="dr-grp">
          <div className="dr-ttl">Workspace</div>
          {MODULES.map((m) => (
            <a key={m.v} className={`dr-item${pathname.startsWith('/rooms') && m.v === 'rooms' ? ' on' : ''}`} onClick={() => go(m.to)}>
              <Icon name={m.icon} size={17} />
              {m.name}
            </a>
          ))}
        </div>

        <div className="dr-grp">
          <div className="dr-ttl">Data Rooms</div>
          <a className={`dr-item${pathname.startsWith('/rooms/competitor') ? ' on' : ''}`} onClick={() => go('/rooms/competitor')}>
            <Icon name="building" size={17} />
            Competitor Data Room
            <span className="tag">{COMPETITORS.length}</span>
          </a>
          <a className={`dr-item${pathname.startsWith('/rooms/documents') ? ' on' : ''}`} onClick={() => go('/rooms/documents')}>
            <Icon name="docs" size={17} />
            Document Data Room
          </a>
          <a className={`dr-item${pathname.startsWith('/rooms/product') ? ' on' : ''}`} onClick={() => go('/rooms/product')}>
            <Icon name="box" size={17} />
            Product Data Room
            <span className="tag">{FUNDS.length}</span>
          </a>
        </div>

        <div className="dr-foot">
          {FOOT.map((f) => (
            <a key={f.v} className="dr-item" title={`${f.name} · coming soon`}>
              <Icon name={f.icon} size={17} />
              {f.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
