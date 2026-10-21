import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { provideTaiga } from '@taiga-ui/core';
import { Subject } from 'rxjs';
import { PlatformService } from '@app/core/services/platform.service';
import { ShopStore } from '@app/state/shop.store';
import { AppHeader } from './app-header';

interface RenderOptions {
  store?: { name: string; is_open: boolean } | null;
  canInstall?: boolean;
  swEnabled?: boolean;
}

describe('AppHeader', () => {
  const versionUpdates = new Subject<{ type: string }>();
  const activateUpdate = vi.fn(() => Promise.resolve(true));
  const promptInstall = vi.fn(() => Promise.resolve());
  const reloadPage = vi.fn();

  function render(options: RenderOptions = {}): HTMLElement {
    const store = signal(options.store ?? null);
    TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [
        provideTaiga(),
        provideRouter([]),
        {
          provide: SwUpdate,
          useValue: { isEnabled: options.swEnabled ?? false, versionUpdates, activateUpdate },
        },
        {
          provide: PlatformService,
          useValue: {
            canInstall: signal(options.canInstall ?? false),
            promptInstall,
            reloadPage,
          },
        },
        {
          provide: ShopStore,
          useValue: { store, isOpen: computed(() => store()?.is_open ?? false) },
        },
      ],
    });
    const fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const reloadButton = (el: HTMLElement) =>
    el.querySelector<HTMLButtonElement>('button[aria-label="Reload page"]');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('accessibility', () => {
    it('gives the reload button an accessible name and hides its icon', () => {
      const button = render().querySelector('button');

      expect(button?.getAttribute('aria-label')).toBe('Reload page');
      expect(button?.querySelector('tui-icon')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders the home icon as a named link to welcome', () => {
      const link = render().querySelector('a.app-header__link');

      expect(link?.getAttribute('aria-label')).toBe('Home');
      expect(link?.getAttribute('href')).toMatch(/welcome$/);
    });

    it('renders the settings icon as a named link to settings', () => {
      const link = render().querySelector('a[aria-label="Settings"]');

      expect(link?.getAttribute('href')).toMatch(/settings$/);
      expect(link?.querySelector('tui-icon')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('does not render a heading', () => {
      expect(render().querySelector('h1')).toBeNull();
    });
  });

  describe('store state', () => {
    it('shows the store name and an Open badge', () => {
      const el = render({ store: { name: 'Chez Test', is_open: true } });
      const badge = el.querySelector('.app-header__status');

      expect(el.querySelector('.app-header__title')?.textContent.trim()).toBe('Chez Test');
      expect(badge?.textContent.trim()).toBe('Open');
      expect(badge?.getAttribute('data-appearance')).toBe('positive');
      expect(badge?.classList).not.toContain('closed');
    });

    it('shows a Closed badge with the negative appearance', () => {
      const badge = render({ store: { name: 'Chez Test', is_open: false } }).querySelector(
        '.app-header__status',
      );

      expect(badge?.textContent.trim()).toBe('Closed');
      expect(badge?.getAttribute('data-appearance')).toBe('negative');
      expect(badge?.classList).toContain('closed');
    });

    it('falls back to a neutral title and hides the badge when the store is not loaded', () => {
      const el = render({ store: null });

      expect(el.querySelector('.app-header__title')?.textContent.trim()).toBe('Store');
      expect(el.querySelector('.app-header__status')).toBeNull();
    });
  });

  describe('install button', () => {
    it('is hidden when the app cannot be installed', () => {
      expect(render().querySelector('button[aria-label="Install app"]')).toBeNull();
    });

    it('is shown when installable and prompts on click', () => {
      const button = render({ canInstall: true }).querySelector<HTMLButtonElement>(
        'button[aria-label="Install app"]',
      );

      expect(button).not.toBeNull();
      button?.click();
      expect(promptInstall).toHaveBeenCalledOnce();
    });
  });

  describe('reload button', () => {
    it('reloads directly when no update is ready', () => {
      const el = render({ swEnabled: true });

      reloadButton(el)?.click();

      expect(activateUpdate).not.toHaveBeenCalled();
      expect(reloadPage).toHaveBeenCalledOnce();
    });

    it('activates the update then reloads when a new version is ready', async () => {
      const el = render({ swEnabled: true });
      versionUpdates.next({ type: 'VERSION_READY' });

      reloadButton(el)?.click();
      await Promise.resolve();

      expect(activateUpdate).toHaveBeenCalledOnce();
      expect(reloadPage).toHaveBeenCalledOnce();
    });

    it('ignores version updates when the service worker is disabled', () => {
      const el = render({ swEnabled: false });
      versionUpdates.next({ type: 'VERSION_READY' });

      reloadButton(el)?.click();

      expect(activateUpdate).not.toHaveBeenCalled();
      expect(reloadPage).toHaveBeenCalledOnce();
    });
  });
});
