import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { Promotion } from '@app/core/models/promotion.model';

@Component({
  selector: 'app-coupon-banner',
  imports: [TuiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coupon-banner.html',
  styleUrl: './coupon-banner.css',
})
export class CouponBanner {
  readonly promotion = input<Promotion | null>();
  readonly dismissed = output();

  readonly closed = signal(false);
  readonly copied = signal(false);

  readonly visiblePromotion = computed(() => {
    const promotion = this.promotion();
    return promotion?.is_active && !this.closed() ? promotion : null;
  });

  readonly discountLabel = computed(() => {
    const promotion = this.visiblePromotion();
    if (!promotion) {
      return '';
    }
    const amount = String(promotion.value);
    return promotion.type === 'percentage' ? `-${amount} %` : `-${amount} €`;
  });

  async copy(): Promise<void> {
    const promotion = this.visiblePromotion();
    if (!promotion) {
      return;
    }
    try {
      await navigator.clipboard.writeText(promotion.code);
      this.copied.set(true);
    } catch {
      // Clipboard unavailable or denied: the code stays selectable in the banner.
      this.copied.set(false);
    }
  }

  close(): void {
    this.closed.set(true);
    // The parent is responsible for moving the focus, the focused button is removed.
    this.dismissed.emit();
  }
}
