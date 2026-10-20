import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { MenuCategory } from '@app/core/models/menu-item.model';

@Component({
  selector: 'app-menu-category-selection',
  templateUrl: './menu-category-selection.html',
  styleUrl: './menu-category-selection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuCategorySelection {
  readonly categories = input<MenuCategory[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly selectionChange = output<string | null>();

  private readonly chips = viewChildren<ElementRef<HTMLButtonElement>>('chip');

  constructor() {
    afterRenderEffect(() => {
      const selectedId = this.selectedId() ?? '';
      this.categories();
      const active = this.chips().find((chip) => chip.nativeElement.dataset['id'] === selectedId);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      active?.nativeElement.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    });
  }
}
