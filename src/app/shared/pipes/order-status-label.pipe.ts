import { Pipe, PipeTransform } from '@angular/core';
import { OrderStatus } from '../../core/models/order.model';

@Pipe({
  name: 'orderStatusLabel',
})
export class OrderStatusLabelPipe implements PipeTransform {

  transform(status: OrderStatus): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'preparing':
        return 'Preparing';
      case'ready':
        return 'Ready';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }

  }
}
