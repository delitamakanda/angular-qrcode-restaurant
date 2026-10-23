import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { routes } from '@app/app.routes';
import { ShopStore } from '@app/state/shop.store';
import { ThemeStore } from '@app/state/theme.store';
import { APP_VERSION } from '@environments/version';
import { SettingsPage } from './settings-page';

describe('SettingsPage', () => {
  function render(): HTMLElement {
    TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideTaiga(),
        provideRouter([]),
        { provide: ShopStore, useValue: { store: signal({ name: 'Chez Test' }) } },
      ],
    });
    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the page title and a back link to welcome', () => {
    const el = render();

    expect(el.querySelector('h1')?.textContent.trim()).toBe('Settings');
    expect(el.querySelector('a.settings-page__back')?.getAttribute('href')).toMatch(/welcome$/);
  });

  it('renders three sections labelled by their heading', () => {
    const sections = Array.from(render().querySelectorAll('section'));

    expect(sections.map((s) => s.querySelector('h2')?.textContent.trim())).toEqual([
      'Language',
      'Appearance',
      'About',
    ]);
    for (const section of sections) {
      const heading = section.querySelector('h2');
      expect(section.getAttribute('aria-labelledby')).toBe(heading?.id);
    }
  });

  it('shows the app version and the store name', () => {
    const el = render();

    expect(el.querySelector('.settings-page__version')?.textContent.trim()).toBe(APP_VERSION);
    expect(el.querySelector('.settings-page__store')?.textContent.trim()).toBe('Chez Test');
  });

  it('marks language as coming soon without enabled controls', () => {
    const [language] = Array.from(render().querySelectorAll('section'));
    const enabled = 'button:not([disabled]), a, input:not([disabled])';

    expect(language.textContent).toContain('Coming soon');
    expect(language.querySelectorAll(enabled)).toHaveLength(0);
  });

  it('offers three theme options with System checked by default', () => {
    const appearance = Array.from(render().querySelectorAll('section'))[1];
    const radios = Array.from(appearance.querySelectorAll<HTMLInputElement>('input[type=radio]'));

    expect(appearance.textContent).not.toContain('Coming soon');
    expect(appearance.querySelector('[role=radiogroup]')).not.toBeNull();
    expect(radios.map((r) => r.value)).toEqual(['system', 'light', 'dark']);
    expect(radios.map((r) => r.checked)).toEqual([true, false, false]);
  });

  it('updates the preference and checked state when an option is chosen', () => {
    const el = render();
    const store = TestBed.inject(ThemeStore);
    const setPreference = vi.spyOn(store, 'setPreference');
    const dark = el.querySelector<HTMLInputElement>('input[value=dark]');

    dark?.click();
    TestBed.inject(ApplicationRef).tick();

    expect(setPreference).toHaveBeenCalledWith('dark');
    expect(store.preference()).toBe('dark');
    expect(dark?.checked).toBe(true);
  });

  it('is registered as a lazy child route of store/:storeId', async () => {
    const shop = routes.find((r) => r.path === 'store/:storeId');
    const child = shop?.children?.find((r) => r.path === 'settings');
    const load = child?.loadComponent as () => Promise<unknown>;

    expect(await load()).toBe(SettingsPage);
  });
});
