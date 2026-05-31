import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TuiLoader, tuiLoaderOptionsProvider } from '@taiga-ui/core';

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

  ngOnInit(): void {
    setTimeout(() => {
      this.hideSplashScreen();
    }, 3000);
  }

  private hideSplashScreen(): void {
    const splashScreenElement = document.getElementById('splash-screen');
    if (splashScreenElement) {
      splashScreenElement.style.opacity = '0';
      setTimeout(() => {
        // hide the splash screen after the fade-out transition
        splashScreenElement.style.display = 'none';
      }, 500);
    }
  }
}
