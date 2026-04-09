import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShopStore } from '../../../../state/shop.store';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderMode } from '../../../../core/models/store.model';

@Component({
  selector: 'app-welcome-page',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css',
})
export class WelcomePage {
  private readonly shopStore = inject(ShopStore);
  private readonly router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly store = this.shopStore.store;

  selectMode(mode: OrderMode): void {
    this.shopStore.selectedMode.set(mode);
    void this.router.navigate(['../menu'], { relativeTo: this.route });
  }
}
