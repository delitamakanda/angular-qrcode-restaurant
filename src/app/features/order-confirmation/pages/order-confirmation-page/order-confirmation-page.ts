import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { OrderApiService } from '../../../../core/api/order-api.service';
import { Order } from '../../../../core/models/order.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-order-confirmation-page',
  imports: [RouterLink, CurrencyFormatPipe],
  templateUrl: './order-confirmation-page.html',
  styleUrl: './order-confirmation-page.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmationPage {
  private readonly route = inject(ActivatedRoute);
  private readonly orderApi = inject(OrderApiService);

  readonly order = signal<Order | null>(null)

  constructor() {
    this.loadOrder();
  }

  private async loadOrder(): Promise<void> {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (!orderId) {
      return;
    }
    this.order.set(await firstValueFrom(this.orderApi.getOrder(orderId)));
  }
}
