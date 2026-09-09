import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { Layout } from './components/Layout'

const MapPage = lazy(() => import('./pages/MapPage'))
const FeedPage = lazy(() => import('./pages/FeedPage'))
const MissingPage = lazy(() => import('./pages/MissingPage'))
const EmergencyPage = lazy(() => import('./pages/EmergencyPage'))

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<MapPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/missing" element={<MissingPage />} />
              <Route path="/emergency" element={<EmergencyPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DataProvider>
  )
}
