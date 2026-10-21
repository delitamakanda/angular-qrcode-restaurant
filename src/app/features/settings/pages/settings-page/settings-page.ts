import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopStore } from '@app/state/shop.store';
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
  readonly appVersion = APP_VERSION;
}
