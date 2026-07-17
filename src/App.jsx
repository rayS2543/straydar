import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { Layout } from './components/Layout'
import MapPage from './pages/MapPage'
import FeedPage from './pages/FeedPage'
import MissingPage from './pages/MissingPage'
import EmergencyPage from './pages/EmergencyPage'

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MapPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/missing" element={<MissingPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}
