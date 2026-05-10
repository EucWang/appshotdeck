import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  isDark: boolean
  toggle: () => void
}

const systemDark =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: systemDark,
      toggle: () => set((s) => ({ isDark: !s.isDark })),
    }),
    { name: 'appshotdeck-theme' }
  )
)
