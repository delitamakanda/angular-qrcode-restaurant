import { TuiRoot } from '@taiga-ui/core';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeStore } from '@app/state/theme.store';
import { SplashScreen } from '@app/features/splash-screen/splash-screen';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, SplashScreen],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Instantiated eagerly so the saved theme is applied at startup.
  private readonly theme = inject(ThemeStore);
}
