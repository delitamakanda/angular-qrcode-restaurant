import { TestBed } from '@angular/core/testing';
import { MenuApiService } from '@app/core/api/menu-api.service';
import { MenuItem } from '@app/core/models/menu-item.model';
import { NotificationService } from '@app/core/services/notification.service';
import { CartStore } from '@app/state/cart.store';
import { TuiDialogService } from '@taiga-ui/core';
import { Subject, of, throwError } from 'rxjs';
import { ProductCustomizationService } from './product-customization.service';

const item = {
  id: 'm1',
  name: 'Burger',
  category_id: 'c1',
  base_price: 5,
  is_sold_out: false,
} as MenuItem;

describe('ProductCustomizationService.open', () => {
  const addToCart = vi.fn();
  const success = vi.fn();
  const getItemWithModifiers = vi.fn();
  const dialogOpen = vi.fn();

  beforeEach(() => {
    addToCart.mockReset();
    success.mockReset();
    getItemWithModifiers.mockReset();
    dialogOpen.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: CartStore, useValue: { addToCart } },
        { provide: NotificationService, useValue: { success } },
        { provide: MenuApiService, useValue: { getItemWithModifiers } },
        { provide: TuiDialogService, useValue: { open: dialogOpen } },
      ],
    });
  });

  function run(): boolean[] {
    const emitted: boolean[] = [];
    TestBed.inject(ProductCustomizationService)
      .open(item)
      .subscribe((added) => emitted.push(added));
    return emitted;
  }

  it('reports true for a direct add, without opening the dialog', () => {
    getItemWithModifiers.mockReturnValue(of({ ...item, modifierGroups: [] }));

    expect(run()).toEqual([true]);
    expect(addToCart).toHaveBeenCalledTimes(1);
    expect(dialogOpen).not.toHaveBeenCalled();
  });

  it('reports true when the dialog closes with "added"', () => {
    const result = new Subject<'added' | undefined>();
    getItemWithModifiers.mockReturnValue(of({ ...item, modifierGroups: [{ id: 'g' }] }));
    dialogOpen.mockReturnValue(result);

    const emitted = run();
    result.next('added');
    result.complete();

    expect(emitted).toEqual([true]);
  });

  it('reports false when the dialog is dismissed', () => {
    const result = new Subject<'added' | undefined>();
    getItemWithModifiers.mockReturnValue(of({ ...item, modifierGroups: [{ id: 'g' }] }));
    dialogOpen.mockReturnValue(result);

    const emitted = run();
    result.complete();

    expect(emitted).toEqual([false]);
  });

  it('reports false when loading fails and the retry dialog is abandoned', () => {
    const result = new Subject<'added' | undefined>();
    getItemWithModifiers.mockReturnValue(throwError(() => new Error('offline')));
    dialogOpen.mockReturnValue(result);

    const emitted = run();
    result.complete();

    expect(emitted).toEqual([false]);
    expect(addToCart).not.toHaveBeenCalled();
  });
});
