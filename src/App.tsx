import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { ShowPage } from './pages/ShowPage'
import { StartPage } from './pages/StartPage'

export default function App() {
  return (
    <BrowserRouter basename="/meteroo">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/start" element={<StartPage />} />
        <Route path="/show" element={<ShowPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
