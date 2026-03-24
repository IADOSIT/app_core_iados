import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  set: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggle: () =>
        set((s) => {
          const next = s.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          return { theme: next };
        }),
      set: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
    }),
    { name: 'iados-theme' }
  )
);

// Aplicar tema al cargar la página
export const initTheme = () => {
  const stored = localStorage.getItem('iados-theme');
  let theme = 'dark';
  try {
    theme = JSON.parse(stored || '{}').state?.theme || 'dark';
  } catch {}
  document.documentElement.setAttribute('data-theme', theme);
};
