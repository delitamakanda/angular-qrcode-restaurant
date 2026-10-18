import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-menu-item-card-skeleton',
  templateUrl: './menu-item-card-skeleton.html',
  styleUrl: './menu-item-card-skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class MenuItemCardSkeleton {}
