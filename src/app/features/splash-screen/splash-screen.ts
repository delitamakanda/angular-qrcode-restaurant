import { Component, effect, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ShopStore } from '@app/state/shop.store';
import { UiStore } from '@app/state/ui.store';
import { TuiLoader, tuiLoaderOptionsProvider } from '@taiga-ui/core';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-splash-screen',
  imports: [TuiLoader],
  providers: [
    tuiLoaderOptionsProvider({
      size: 'xl',
    }),
  ],
  templateUrl: './splash-screen.html',
  styleUrls: ['./splash-screen.css'],
  standalone: true,
})
export class SplashScreen implements OnInit {
  private readonly router = inject(Router);
  private readonly shopStore = inject(ShopStore);
  private readonly uiStore = inject(UiStore);

  private readonly minimumDisplayTime = 3000; // Minimum time to show the splash screen in milliseconds
  private readonly maximumDisplayTime = 10000; // Maximum time to show the splash screen in milliseconds
  private startTime = Date.now();
  private hadHidden = false;

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
  );

  constructor() {
    effect(() => {
      const isShopLoading = this.shopStore.isLoading();
      const isGlobalLoading = this.uiStore.isGlobalLoading();
      const navigationEnded = this.navigationEnd();

      if (!this.hadHidden && navigationEnded && !isShopLoading && !isGlobalLoading) {
        this.hideSplashScreenWhenReady();
      }
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (!this.hadHidden) {
        this.hideSplashScreen();
      }
    }, this.maximumDisplayTime);
  }

  private hideSplashScreen(): void {
    if (this.hadHidden) {
      return;
    }
    this.hadHidden = true;
    const splashScreenElement = document.getElementById('splash-screen');

    if (splashScreenElement) {
      splashScreenElement.style.opacity = '0';
      splashScreenElement.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => {
        // hide the splash screen after the fade-out transition
        splashScreenElement.style.display = 'none';
      }, 500);
    }
  }

  private hideSplashScreenWhenReady(): void {
    const elapsedTime = Date.now() - this.startTime;
    const remainingTime = Math.max(0, this.minimumDisplayTime - elapsedTime);

    // Ensure the splash screen is hidden after the maximum display time regardless of loading state
    setTimeout(() => {
      this.hideSplashScreen();
    }, remainingTime);
  }
}
