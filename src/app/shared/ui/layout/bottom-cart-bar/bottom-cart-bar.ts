import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CartStore } from '@app/state/cart.store';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-bottom-cart-bar',
  imports: [CurrencyFormatPipe, TuiButton],
  templateUrl: './bottom-cart-bar.html',
  styleUrl: './bottom-cart-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomCartBar {
  private readonly cartStore = inject(CartStore);
  readonly count = this.cartStore.count;
  readonly total = this.cartStore.total;
  readonly isVisible = computed(() => this.count() > 0);
  readonly openCart = output();
  /** Alternates a/b on each count change so the pop keyframes restart; null until the first change. */
  protected readonly pop = signal<'a' | 'b' | null>(null);
  private previousCount: number | null = null;

  constructor() {
    effect(() => {
      const count = this.count();
      const previous = this.previousCount;
      this.previousCount = count;

      // Skip the initial render, a bar that just appeared (the entry animation covers it)
      // and reduced-motion users.
      if (previous === null || previous === 0 || count === 0 || previous === count) {
        return;
      }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      untracked(() => {
        this.pop.update((current) => (current === 'a' ? 'b' : 'a'));
      });
    });
  }

  goToCart(): void {
    this.openCart.emit();
  }
}
