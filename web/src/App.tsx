// Compass app: routing model per spec §4.2. Only Rooms is exposed this sprint.
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { UiProvider } from './components/ui-context'
import { RoomsLayout } from './features/rooms/RoomsLayout'
import { ProductScreener } from './features/rooms/ProductScreener'
import { FundDetail } from './features/rooms/FundDetail'
import { CompanyScreener } from './features/rooms/CompanyScreener'
import { CompanyDetail } from './features/rooms/CompanyDetail'
import { CompetitorRadar } from './features/radar/CompetitorRadar'
import { SettingsLayout } from './features/settings/SettingsLayout'
import { DocumentFetcher } from './features/settings/DocumentFetcher'
import { FinancialFetcher } from './features/settings/FinancialFetcher'
import { CoverageMatrix } from './features/settings/CoverageMatrix'
import { ProductFetcher } from './features/settings/ProductFetcher'
import { ProductCoverage } from './features/settings/ProductCoverage'

export default function App() {
  return (
    <BrowserRouter>
      <UiProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/rooms/product" replace />} />
            <Route path="rooms" element={<RoomsLayout />}>
              <Route index element={<Navigate to="/rooms/product" replace />} />
              <Route path="product" element={<ProductScreener />} />
              <Route path="product/:fundId" element={<FundDetail />} />
              {/* Competitor Data Room = the competitor hub (table → company detail) */}
              <Route path="competitor" element={<CompetitorRadar />} />
              <Route path="competitor/:companyId" element={<CompanyDetail />} />
              {/* Document Data Room = the flat document feed */}
              <Route path="documents" element={<CompanyScreener />} />
              {/* legacy redirects */}
              <Route path="company" element={<Navigate to="/rooms/documents" replace />} />
              <Route path="company/:companyId" element={<Navigate to="/rooms/competitor" replace />} />
              <Route path="radar" element={<Navigate to="/rooms/competitor" replace />} />
              <Route path="radar/competitors" element={<Navigate to="/rooms/competitor" replace />} />
            </Route>
            {/* Settings → Data Fetcher → Document Fetcher (scraper status dashboard) */}
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/settings/data-fetcher/documents" replace />} />
              <Route path="data-fetcher" element={<Navigate to="/settings/data-fetcher/documents" replace />} />
              <Route path="data-fetcher/documents" element={<DocumentFetcher />} />
              <Route path="data-fetcher/financials" element={<FinancialFetcher />} />
              <Route path="data-fetcher/products" element={<ProductFetcher />} />
              <Route path="data-coverage" element={<Navigate to="/settings/data-coverage/financials" replace />} />
              <Route path="data-coverage/financials" element={<CoverageMatrix />} />
              <Route path="data-coverage/products" element={<ProductCoverage />} />
              {/* legacy redirects */}
              <Route path="data-fetcher/coverage" element={<Navigate to="/settings/data-coverage/financials" replace />} />
              <Route path="data-fetcher/product-fetcher" element={<Navigate to="/settings/data-fetcher/products" replace />} />
              <Route path="data-fetcher/product-coverage" element={<Navigate to="/settings/data-coverage/products" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/rooms/product" replace />} />
          </Route>
        </Routes>
      </UiProvider>
    </BrowserRouter>
  )
}
