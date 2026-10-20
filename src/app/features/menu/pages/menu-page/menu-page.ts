import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { MenuItemCard } from '@shared/ui/cards/menu-item-card/menu-item-card';
import { MenuItemCardSkeleton } from '@shared/ui/cards/menu-item-card-skeleton/menu-item-card-skeleton';
import { ActivatedRoute } from '@angular/router';
import { ShopStore } from '@app/state/shop.store';
import { MenuStore } from '@app/state/menu.store';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, EMPTY } from 'rxjs';
import { MenuCategorySelection } from '@app/features/menu/components/menu-category-selection/menu-category-selection';
import { ProductSearch } from '@app/features/menu/components/product-search/product-search';

const ANCHOR_PREFIX = 'category-';

@Component({
  selector: 'app-menu-page',
  imports: [MenuItemCard, MenuItemCardSkeleton, MenuCategorySelection, ProductSearch],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage {
  private readonly route = inject(ActivatedRoute);
  private readonly shopStore = inject(ShopStore);
  private readonly location = inject(Location);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly menuStore = inject(MenuStore);

  protected readonly skeletonSlots = Array.from({ length: 6 });

  protected readonly navCategories = computed(() =>
    this.menuStore.itemsByCategory().map((section) => section.category),
  );

  /** Ids of the first two cards of the page, whose images load eagerly. */
  protected readonly priorityIds = computed(
    () =>
      new Set(
        this.menuStore
          .itemsByCategory()
          .flatMap((section) => section.items)
          .slice(0, 2)
          .map((item) => item.id),
      ),
  );

  private readonly storeId = toSignal(
    (this.route.parent?.paramMap ?? EMPTY).pipe(map((params) => params.get('storeId'))),
  );

  private readonly search = viewChild(ProductSearch);

  protected readonly showNoResults = computed(
    () =>
      !this.menuStore.isLoading() &&
      this.menuStore.filteredItems().length === 0 &&
      this.menuStore.items().length > 0,
  );

  protected readonly resultsAnnouncement = computed(() => {
    if (this.menuStore.isLoading() || !this.menuStore.searchTerm().trim()) {
      return '';
    }
    const count = this.menuStore.filteredItems().length;
    return count === 0 ? 'No results' : `${String(count)} ${count === 1 ? 'result' : 'results'}`;
  });

  private observer: IntersectionObserver | null = null;
  private fragmentHandled = false;

  constructor() {
    effect(() => {
      const storeId = this.storeId() as string | null;
      const mode = this.shopStore.selectedMode();

      if (!storeId || !mode) {
        return;
      }
      void this.menuStore.loadMenu(storeId, mode);
    });

    afterRenderEffect(() => {
      const sections = this.menuStore.isLoading() ? [] : this.menuStore.itemsByCategory();
      this.observeSections(sections.map((section) => section.category.id));
    });

    this.destroyRef.onDestroy(() => {
      this.disconnectObserver();
    });
  }

  protected scrollToCategory(categoryId: string): void {
    const section = this.findSection(categoryId);
    if (!section) {
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    this.menuStore.activeCategoryId.set(categoryId);
    const path = this.location.path().split('#')[0];
    this.location.replaceState(`${path}#${ANCHOR_PREFIX}${categoryId}`);
  }

  private findSection(categoryId: string): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(
      `[id="${ANCHOR_PREFIX}${categoryId}"]`,
    );
  }

  private observeSections(categoryIds: string[]): void {
    this.disconnectObserver();
    if (categoryIds.length === 0) {
      return;
    }
    this.scrollToFragmentOnce();
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    const visible = new Set<string>();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id.slice(ANCHOR_PREFIX.length);
          if (entry.isIntersecting) {
            visible.add(id);
          } else {
            visible.delete(id);
          }
        }
        const active = categoryIds.find((id) => visible.has(id));
        if (active) {
          this.menuStore.activeCategoryId.set(active);
        }
      },
      // Only the band just under the sticky nav counts as "reading position".
      { rootMargin: '-140px 0px -60% 0px' },
    );
    for (const id of categoryIds) {
      const section = this.findSection(id);
      if (section) {
        this.observer.observe(section);
      }
    }
  }

  private scrollToFragmentOnce(): void {
    if (this.fragmentHandled) {
      return;
    }
    this.fragmentHandled = true;
    const fragment = window.location.hash.slice(1);
    if (!fragment.startsWith(ANCHOR_PREFIX)) {
      return;
    }
    // Sections only exist once the menu is loaded, after the router's own anchor scrolling.
    this.host.nativeElement.querySelector(`[id="${fragment}"]`)?.scrollIntoView();
  }

  private disconnectObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  protected clearSearch(): void {
    this.menuStore.setSearchTerm('');
    this.search()?.focus();
  }
}
