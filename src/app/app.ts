import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ShopShell } from './features/shop-shell/shop-shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShopShell],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
}
