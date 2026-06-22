// Compass app: routing model per spec §4.2. Only Rooms is exposed this sprint.
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { UiProvider } from './components/ui-context'
import { RoomsLayout } from './features/rooms/RoomsLayout'
import { ProductScreener } from './features/rooms/ProductScreener'
import { FundDetail } from './features/rooms/FundDetail'
import { CompanyScreener } from './features/rooms/CompanyScreener'
import { CompanyDetail } from './features/rooms/CompanyDetail'

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
              <Route path="company" element={<CompanyScreener />} />
              <Route path="company/:companyId" element={<CompanyDetail />} />
            </Route>
            <Route path="*" element={<Navigate to="/rooms/product" replace />} />
          </Route>
        </Routes>
      </UiProvider>
    </BrowserRouter>
  )
}
