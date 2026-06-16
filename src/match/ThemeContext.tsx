import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getTheme, DEFAULT_THEME_ID, type Theme } from './themes'

const THEME_KEY = 'mythos-theme-v1'

interface ThemeContextValue {
  theme: Theme
  themeId: string
  setTheme: (id: string) => void
}

function loadThemeId(): string {
  try {
    return localStorage.getItem(THEME_KEY) ?? DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}

// Default value means components used without a provider render the default
// theme rather than throwing — keeps existing component tests provider-free.
const ThemeContext = createContext<ThemeContextValue>({
  theme: getTheme(null),
  themeId: DEFAULT_THEME_ID,
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(loadThemeId)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, themeId)
    } catch {
      // storage unavailable / quota — non-fatal
    }
  }, [themeId])

  const theme = getTheme(themeId)

  // Paint the page backdrop with the theme colour so it sits behind both screens;
  // the Settings exit fade then reveals this colour instead of a hard black flash.
  useEffect(() => {
    document.body.style.backgroundColor = theme.backdrop
  }, [theme.backdrop])

  return (
    <ThemeContext.Provider value={{ theme, themeId: theme.id, setTheme: setThemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
