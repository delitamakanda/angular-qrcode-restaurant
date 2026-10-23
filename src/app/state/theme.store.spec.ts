import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeStore } from './theme.store';

describe('ThemeStore', () => {
  let systemDark: boolean;
  let listeners: ((event: { matches: boolean }) => void)[];

  beforeEach(() => {
    systemDark = false;
    listeners = [];
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return systemDark;
      },
      addEventListener: (_: string, fn: (event: { matches: boolean }) => void) =>
        listeners.push(fn),
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  function create(): ThemeStore {
    const store = TestBed.inject(ThemeStore);
    TestBed.tick();
    return store;
  }

  it('defaults to system when nothing is stored', () => {
    expect(create().preference()).toBe('system');
  });

  it('restores a valid stored preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const store = create();

    expect(store.preference()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('ignores an invalid stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');

    expect(create().preference()).toBe('system');
  });

  it('persists the preference and sets data-theme on <html>', () => {
    const store = create();

    store.setPreference('dark');
    TestBed.tick();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    store.setPreference('light');
    TestBed.tick();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('follows prefers-color-scheme in system mode only', () => {
    const store = create();
    expect(store.resolved()).toBe('light');

    listeners.forEach((fn) => {
      fn({ matches: true });
    });
    expect(store.resolved()).toBe('dark');

    store.setPreference('light');
    expect(store.resolved()).toBe('light');

    store.setPreference('dark');
    listeners.forEach((fn) => {
      fn({ matches: false });
    });
    expect(store.resolved()).toBe('dark');
  });

  it('does not throw when localStorage is unavailable', () => {
    // Only the theme key throws: Taiga reads its own key unguarded.
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => {
        if (key === THEME_STORAGE_KEY) throw new Error('denied');
        return null;
      },
      setItem: (key: string) => {
        if (key === THEME_STORAGE_KEY) throw new Error('denied');
      },
    });

    const store = create();
    store.setPreference('dark');

    expect(() => {
      TestBed.tick();
    }).not.toThrow();
    expect(store.preference()).toBe('dark');
  });
});
