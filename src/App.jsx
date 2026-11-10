import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Squad from './pages/Squad'
import MatchDay from './pages/MatchDay'
import Transfers from './pages/Transfers'
import Facilities from './pages/Facilities'
import League from './pages/League'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/squad" element={<Squad />} />
        <Route path="/matchday" element={<MatchDay />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/facilities" element={<Facilities />} />
        <Route path="/league" element={<League />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
