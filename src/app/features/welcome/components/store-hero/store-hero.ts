import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Store } from '@app/core/models/store.model';

@Component({
  selector: 'app-store-hero',
  imports: [NgOptimizedImage],
  templateUrl: './store-hero.html',
  styleUrl: './store-hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreHero {
  readonly store = input.required<Store>();
}
