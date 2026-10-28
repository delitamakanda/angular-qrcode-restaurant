import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { MenuApiService, MenuItemWithModifiers } from '@app/core/api/menu-api.service';
import { MenuItem } from '@app/core/models/menu-item.model';
import { NotificationService } from '@app/core/services/notification.service';
import { CartStore } from '@app/state/cart.store';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';
import { TuiButton, type TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import { ModifierGroup } from '../../components/modifier-group/modifier-group';
import { ProductNote } from '../../components/product-note/product-note';
import {
  MAX_QUANTITY,
  MIN_QUANTITY,
  Selection,
  buildCartItem,
  clampQuantity,
  minSelect,
  missingGroups,
  toSelectedOptions,
  toggleOption,
  totalPrice,
} from '../../utils/customization-price';

export type ProductCustomizationResult = 'added' | undefined;

type LoadState = 'loading' | 'error' | 'ready';

@Component({
  selector: 'app-product-customization-dialog',
  imports: [
    CurrencyFormatPipe,
    ImgFallbackDirective,
    ModifierGroup,
    ProductNote,
    ReactiveFormsModule,
    TuiButton,
  ],
  templateUrl: './product-customization-dialog.html',
  styleUrl: './product-customization-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCustomizationDialog {
  private readonly context =
    injectContext<TuiDialogContext<ProductCustomizationResult, MenuItem>>();
  private readonly menuApi = inject(MenuApiService);
  private readonly cartStore = inject(CartStore);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly placeholder = '/images/placeholder-food.svg';
  protected readonly minQuantity = MIN_QUANTITY;
  protected readonly maxQuantity = MAX_QUANTITY;

  protected readonly product = signal<MenuItem>(this.context.data);
  // Groups already fetched by the opener: show them right away, no loading flash.
  protected readonly state = signal<LoadState>(
    this.context.data.modifierGroups?.length ? 'ready' : 'loading',
  );
  protected readonly selection = signal<Selection>({});
  protected readonly quantity = signal(MIN_QUANTITY);

  protected readonly form: FormGroup<{ note: FormControl<string> }> = inject(
    NonNullableFormBuilder,
  ).group({ note: '' });

  protected readonly groups = computed(() => this.product().modifierGroups ?? []);
  protected readonly missing = computed(() => missingGroups(this.groups(), this.selection()));
  protected readonly canAdd = computed(
    () => this.state() === 'ready' && this.missing().length === 0,
  );
  protected readonly selectedOptions = computed(() =>
    toSelectedOptions(this.groups(), this.selection()),
  );
  protected readonly total = computed(() =>
    totalPrice(this.product().base_price, this.selectedOptions(), this.quantity()),
  );
  protected readonly errorMessage = computed(() => {
    const first = this.missing().at(0);
    if (this.state() !== 'ready' || !first) {
      return '';
    }
    const count = minSelect(first);
    return `Choose at least ${String(count)} option${count > 1 ? 's' : ''} for ${first.name}.`;
  });

  constructor() {
    if (this.state() === 'loading') {
      this.load();
    }
  }

  protected load(): void {
    this.state.set('loading');
    this.menuApi
      .getItemWithModifiers(this.context.data.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item: MenuItemWithModifiers) => {
          if (item.modifierGroups.length === 0) {
            // Nothing to customise: behave like a plain add-to-cart.
            this.product.set(item);
            this.addToCart();
            return;
          }
          this.product.set(item);
          this.state.set('ready');
        },
        error: () => {
          this.state.set('error');
        },
      });
  }

  protected isMissing(groupId: string): boolean {
    return this.missing().some((group) => group.id === groupId);
  }

  protected onToggle(groupId: string, optionId: string): void {
    const group = this.groups().find((candidate) => candidate.id === groupId);
    if (!group) {
      return;
    }
    this.selection.update((current) => ({
      ...current,
      [groupId]: toggleOption(group, current[groupId] ?? [], optionId),
    }));
  }

  protected onClear(groupId: string): void {
    this.selection.update((current) => ({ ...current, [groupId]: [] }));
  }

  protected changeQuantity(delta: number): void {
    this.quantity.update((current) => clampQuantity(current + delta));
  }

  protected submit(): void {
    if (!this.canAdd()) {
      return;
    }
    this.addToCart();
  }

  private addToCart(): void {
    const product = this.product();
    const options = this.selectedOptions();
    const quantity = this.quantity();

    this.cartStore.addToCart(
      buildCartItem(product, options, quantity, this.form.controls.note.value),
    );
    this.notifications.success(`${product.name} added to cart`);
    this.context.completeWith('added');
  }
}
