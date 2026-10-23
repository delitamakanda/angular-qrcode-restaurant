import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopStore } from '@app/state/shop.store';
import { ThemePreference, ThemeStore } from '@app/state/theme.store';
import { APP_VERSION } from '@environments/version';

@Component({
  selector: 'app-settings-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  readonly store = inject(ShopStore).store;
  readonly theme = inject(ThemeStore);
  readonly themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
  readonly appVersion = APP_VERSION;
}
