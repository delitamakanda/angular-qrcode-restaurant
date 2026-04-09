import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeader } from '../../shared/ui/layout/app-header/app-header';
import { BottomCartBar } from '../../shared/ui/layout/bottom-cart-bar/bottom-cart-bar';

@Component({
  selector: 'app-shop-shell',
  imports: [
    RouterOutlet,
    AppHeader,
    BottomCartBar
  ],
  templateUrl: './shop-shell.html',
  styleUrl: './shop-shell.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopShell {}
