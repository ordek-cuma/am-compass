// Subpanel content for Rooms: filter box + the two data-room destinations + Recently Opened.
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon, MagIcon, type IconName } from '../../components/icons'
import { COMPANIES } from '../../data/companies'
import { COMPETITORS } from '../../data/competitors'
import { FUNDS } from '../../data/funds'

function RoomNav({ to, label, icon, count, active }: { to: string; label: string; icon: IconName; count: number; active: boolean }) {
  const navigate = useNavigate()
  return (
    <div className={`sp-row room-nav${active ? ' on' : ''}`} onClick={() => navigate(to)}>
      <span className="sp-ic">
        <Icon name={icon} size={15} />
      </span>
      <span className="sp-txt">{label}</span>
      <span className="sp-count">{count}</span>
    </div>
  )
}

export function RoomsSubnav() {
  const { pathname } = useLocation()
  const [recentClosed, setRecentClosed] = useState(false)
  const onCompany = pathname.startsWith('/rooms/competitor')
  const onProduct = pathname.startsWith('/rooms/product')
  const onRadar = pathname.startsWith('/rooms/radar')

  return (
    <>
      <div className="sp-head">
        <span className="sp-title">Rooms</span>
      </div>
      <div className="sp-filter">
        <MagIcon />
        Filter rooms…
      </div>
      <div className="sp-treehead">Radar</div>
      <div className="sp-grp-b">
        <RoomNav to="/rooms/radar/competitors" label="Competitor Radar" icon="target" count={COMPETITORS.length} active={onRadar} />
      </div>
      <div className="sp-treehead">Data Rooms</div>
      <div className="sp-grp-b">
        <RoomNav to="/rooms/competitor" label="Competitor Data Room" icon="building" count={COMPANIES.length} active={onCompany} />
        <RoomNav to="/rooms/product" label="Product Data Room" icon="box" count={FUNDS.length} active={onProduct} />
      </div>
      <div className={`sp-grp${recentClosed ? ' closed' : ''}`}>
        <button className="sp-grp-h" onClick={() => setRecentClosed((v) => !v)}>
          <span className="sp-caret">▾</span>Recently Opened<span className="sp-count">3</span>
        </button>
        <div className="sp-grp-b">
          {[0, 1, 2].map((i) => (
            <div className="sp-row" key={i}>
              <span className="sp-dot" />
              <span className="sk line w80" style={{ flex: 1, height: 9 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
