'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { fetchUserSettings, updateUserSettings } from '@/lib/analytics-api'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return

  const html = document.documentElement
  const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme

  console.log('Applying theme:', theme, 'effective:', effectiveTheme)

  if (theme === 'auto') {
    html.removeAttribute('data-theme')
  } else {
    html.setAttribute('data-theme', theme)
  }

  // Apply dark class for CSS media query fallback
  if (effectiveTheme === 'dark') {
    html.classList.add('dark')
    html.style.colorScheme = 'dark'
  } else {
    html.classList.remove('dark')
    html.style.colorScheme = 'light'
  }

  // Force reflow to ensure CSS updates
  void html.offsetHeight
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto')
  const [isLoading, setIsLoading] = useState(true)
  const userId = 'default-user'

  // Apply default theme immediately on mount to prevent flash
  useEffect(() => {
    applyTheme('auto')
  }, [])

  useEffect(() => {
    async function loadTheme() {
      try {
        const settings = await fetchUserSettings(userId)
        const userTheme = (settings.theme as Theme) || 'auto'
        console.log('Loaded user theme:', userTheme)
        setThemeState(userTheme)
        applyTheme(userTheme)
      } catch (error) {
        console.error('Failed to load theme settings:', error)
        applyTheme('auto')
        setThemeState('auto')
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'auto') {
        applyTheme('auto')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = async (newTheme: Theme) => {
    console.log('setTheme called with:', newTheme)

    // Update state immediately
    setThemeState(newTheme)
    applyTheme(newTheme)
    console.log('Theme state updated and applied')

    try {
      console.log('Saving theme to backend...')
      await updateUserSettings(userId, { theme: newTheme })
      console.log('Theme saved successfully')
    } catch (error) {
      console.error('Failed to save theme preference:', error)
      // Don't revert on error - keep the UI updated
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}
