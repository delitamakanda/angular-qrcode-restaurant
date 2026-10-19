import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';
import { provideTaiga } from '@taiga-ui/core';
import { SplashScreen } from './splash-screen';

describe('SplashScreen', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTaiga(),
        provideRouter([]),
        provideHttpClient(),
        { provide: APP_TOKEN_CONFIG, useValue: {} },
      ],
    });
  });

  it('renders the logo with an alt text and a loader', () => {
    const fixture = TestBed.createComponent(SplashScreen);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const splash = root.querySelector('#splash-screen');
    const img = splash?.querySelector('img');

    expect(splash).not.toBeNull();
    expect(img?.getAttribute('alt')).toBeTruthy();
    expect(img?.getAttribute('src')).toContain('assets/logo.png');
    expect(splash?.querySelector('tui-loader')).not.toBeNull();
  });

  it('hides itself after the maximum display time', () => {
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(SplashScreen);
      const root = fixture.nativeElement as HTMLElement;
      document.body.appendChild(root);
      fixture.detectChanges();
      const splash = root.querySelector<HTMLElement>('#splash-screen');

      vi.advanceTimersByTime(10000);
      expect(splash?.style.opacity).toBe('0');
      vi.advanceTimersByTime(500);
      expect(splash?.style.display).toBe('none');

      root.remove();
    } finally {
      vi.useRealTimers();
    }
  });
});
