import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { provideTaiga } from '@taiga-ui/core';
import { PlatformService } from '@app/core/services/platform.service';
import { ShopStore } from '@app/state/shop.store';
import { AppHeader } from './app-header';

describe('AppHeader accessibility', () => {
  function render(): HTMLElement {
    TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [
        provideTaiga(),
        provideRouter([]),
        { provide: SwUpdate, useValue: { isEnabled: false } },
        { provide: PlatformService, useValue: { canInstall: signal(false) } },
        { provide: ShopStore, useValue: { store: signal(null) } },
      ],
    });
    const fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

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
});
