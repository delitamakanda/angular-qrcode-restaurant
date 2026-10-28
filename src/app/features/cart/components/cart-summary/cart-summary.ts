import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-cart-summary',
  imports: [CurrencyFormatPipe],
  templateUrl: './cart-summary.html',
  styleUrl: './cart-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-label': 'Résumé de la commande', role: 'region' },
})
export class CartSummary {
  readonly count = input.required<number>();
  readonly total = input.required<number>();
}
