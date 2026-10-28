import { Pipe, PipeTransform } from '@angular/core';
import { ORDER_STATUS_LABELS } from '@app/core/constants/order.constants';
import { OrderStatus } from '@app/core/models/order.model';

@Pipe({
  name: 'orderStatusLabel',
})
export class OrderStatusLabelPipe implements PipeTransform {
  transform(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status];
  }
}
