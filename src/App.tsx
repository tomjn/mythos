import { HashRouter, Routes, Route } from 'react-router-dom'
import { MatchProvider } from '@/match/MatchContext'
import { ThemeProvider } from '@/match/ThemeContext'
import { MatchScreen } from '@/screens/MatchScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { LogScreen } from '@/screens/LogScreen'

export default function App() {
  return (
    <ThemeProvider>
      <MatchProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<MatchScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/log" element={<LogScreen />} />
          </Routes>
        </HashRouter>
      </MatchProvider>
    </ThemeProvider>
  )
}
