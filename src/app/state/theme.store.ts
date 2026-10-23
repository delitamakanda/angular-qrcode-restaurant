import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { TUI_DARK_MODE } from '@taiga-ui/core';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'app-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

@Injectable({
  providedIn: 'root',
})
export class ThemeStore {
  private readonly tuiDarkMode = inject(TUI_DARK_MODE);
  private readonly media = safeMatchMedia();

  readonly preference = signal<ThemePreference>(readStoredPreference());
  private readonly systemDark = signal(this.media?.matches ?? false);

  readonly resolved = computed<'light' | 'dark'>(() => {
    const preference = this.preference();
    if (preference === 'system') {
      return this.systemDark() ? 'dark' : 'light';
    }
    return preference;
  });

  constructor() {
    this.media?.addEventListener('change', (event) => {
      this.systemDark.set(event.matches);
    });

    effect(() => {
      const resolved = this.resolved();
      document.documentElement.setAttribute('data-theme', resolved);
      this.tuiDarkMode.set(resolved === 'dark');
    });

    effect(() => {
      const preference = this.preference();
      try {
        localStorage.setItem(THEME_STORAGE_KEY, preference);
      } catch {
        // Storage unavailable: the preference only lasts for this session.
      }
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
  }
}

function safeMatchMedia(): MediaQueryList | null {
  try {
    return typeof matchMedia === 'function' ? matchMedia(DARK_QUERY) : null;
  } catch {
    return null;
  }
}
