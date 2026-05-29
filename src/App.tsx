import { HashRouter, Routes, Route } from 'react-router-dom'
import { MatchProvider } from '@/match/MatchContext'
import { MatchScreen } from '@/screens/MatchScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { RotateNotice } from '@/components/RotateNotice'

export default function App() {
  return (
    <MatchProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MatchScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </HashRouter>
      <RotateNotice />
    </MatchProvider>
  )
}
