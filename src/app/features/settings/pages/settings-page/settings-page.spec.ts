import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { routes } from '@app/app.routes';
import { ShopStore } from '@app/state/shop.store';
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

    expect(el.querySelector('h1')?.textContent.trim()).toBe('Paramètres');
    expect(el.querySelector('a.settings-page__back')?.getAttribute('href')).toMatch(/welcome$/);
  });

  it('renders three sections labelled by their heading', () => {
    const sections = Array.from(render().querySelectorAll('section'));

    expect(sections.map((s) => s.querySelector('h2')?.textContent.trim())).toEqual([
      'Langue',
      'Apparence',
      'À propos',
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

  it('marks language and appearance as coming soon without enabled controls', () => {
    const [language, appearance] = Array.from(render().querySelectorAll('section'));
    const enabled = 'button:not([disabled]), a, input:not([disabled])';

    expect(language.textContent).toContain('Bientôt disponible');
    expect(appearance.textContent).toContain('Bientôt disponible');
    expect(language.querySelectorAll(enabled)).toHaveLength(0);
    expect(appearance.querySelectorAll(enabled)).toHaveLength(0);
  });

  it('is registered as a lazy child route of store/:storeId', async () => {
    const shop = routes.find((r) => r.path === 'store/:storeId');
    const child = shop?.children?.find((r) => r.path === 'settings');
    const load = child?.loadComponent as () => Promise<unknown>;

    expect(await load()).toBe(SettingsPage);
  });
});
