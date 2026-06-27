// Subpanel content for Settings: section tree. Data Fetcher → Document Fetcher (the scraper
// status dashboard). Mirrors RoomsSubnav.
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/icons'

export function SettingsSubnav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const onDocFetcher = pathname.startsWith('/settings/data-fetcher/documents')
  const onFinFetcher = pathname.startsWith('/settings/data-fetcher/financials')

  return (
    <>
      <div className="sp-head">
        <span className="sp-title">Settings</span>
      </div>
      <div className="sp-treehead">Data Fetcher</div>
      <div className="sp-grp-b">
        <div
          className={`sp-row room-nav sub${onDocFetcher ? ' on' : ''}`}
          onClick={() => navigate('/settings/data-fetcher/documents')}
        >
          <span className="sp-ic">
            <Icon name="docs" size={15} />
          </span>
          <span className="sp-txt">Document Fetcher</span>
        </div>
        <div
          className={`sp-row room-nav sub${onFinFetcher ? ' on' : ''}`}
          onClick={() => navigate('/settings/data-fetcher/financials')}
        >
          <span className="sp-ic">
            <Icon name="pivot" size={15} />
          </span>
          <span className="sp-txt">Financial Fetcher</span>
        </div>
      </div>
    </>
  )
}
