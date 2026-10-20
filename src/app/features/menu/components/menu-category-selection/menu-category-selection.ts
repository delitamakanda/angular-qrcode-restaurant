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
  readonly activeId = input<string | null>(null);
  readonly categorySelected = output<string>();

  private readonly chips = viewChildren<ElementRef<HTMLButtonElement>>('chip');

  constructor() {
    afterRenderEffect(() => {
      const activeId = this.activeId();
      this.categories();
      const active = this.chips().find((chip) => chip.nativeElement.dataset['id'] === activeId);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      active?.nativeElement.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    });
  }
}
