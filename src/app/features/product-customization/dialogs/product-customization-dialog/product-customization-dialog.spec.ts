import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { MenuApiService, MenuItemWithModifiers } from '@app/core/api/menu-api.service';
import { MenuItem } from '@app/core/models/menu-item.model';
import { NotificationService } from '@app/core/services/notification.service';
import { CartStore } from '@app/state/cart.store';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { ProductCustomizationDialog } from './product-customization-dialog';

const opt = (id: string, group_id: string, price_delta = 0, is_available = true) => ({
  id,
  group_id,
  name: id,
  price_delta,
  is_available,
});

const product: MenuItemWithModifiers = {
  id: 'tea',
  name: 'Tea',
  category_id: 'c',
  base_price: 50,
  is_sold_out: false,
  modifierGroups: [
    {
      id: 'size',
      name: 'Size',
      required: true,
      min_select: 1,
      max_select: 1,
      options: [opt('m', 'size'), opt('l', 'size', 10)],
    },
    {
      id: 'top',
      name: 'Toppings',
      required: false,
      max_select: 2,
      options: [opt('a', 'top', 5), opt('b', 'top', 5), opt('c', 'top', 5, false)],
    },
  ],
};

describe('ProductCustomizationDialog', () => {
  const addToCart = vi.fn();
  const success = vi.fn();
  const completeWith = vi.fn();
  let response: unknown;
  let data: MenuItem;

  function render() {
    TestBed.configureTestingModule({
      providers: [
        { provide: CartStore, useValue: { addToCart } },
        { provide: NotificationService, useValue: { success } },
        { provide: MenuApiService, useValue: { getItemWithModifiers: () => response } },
        { provide: POLYMORPHEUS_CONTEXT, useValue: { data, completeWith } },
      ],
    });
    const fixture = TestBed.createComponent(ProductCustomizationDialog);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const click = (selector: string | Element | null) => {
      const target = typeof selector === 'string' ? el.querySelector(selector) : selector;
      (target as HTMLElement).click();
      fixture.detectChanges();
    };
    const add = () => el.querySelector<HTMLButtonElement>('.customization__add');
    const input = (value: string) => el.querySelector<HTMLInputElement>(`input[value="${value}"]`);
    return { fixture, el, click, add, input };
  }

  beforeEach(() => {
    data = { ...product, modifierGroups: undefined };
    addToCart.mockClear();
    success.mockClear();
    completeWith.mockClear();
    response = of(product);
  });

  it('shows a loading state, then the groups', () => {
    const pending = new Subject<MenuItemWithModifiers>();
    response = pending;
    const { fixture, el } = render();

    expect(el.textContent).toContain('Loading options');

    pending.next(product);
    fixture.detectChanges();

    expect(el.querySelectorAll('fieldset').length).toBe(2);
    expect(el.textContent).toContain('Base price');
    expect(el.querySelector('.customization__name')?.textContent).toBe('Tea');
  });

  it('shows an error with a retry action', () => {
    response = throwError(() => new Error('boom'));
    const { fixture, el, click } = render();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('could not load');

    response = of(product);
    click(el.querySelector('[role="alert"] button'));
    fixture.detectChanges();

    expect(el.querySelectorAll('fieldset').length).toBe(2);
  });

  it('disables Add until the required group is satisfied, with a live message', () => {
    const { el, click, add, input } = render();

    expect(add()?.disabled).toBe(true);
    expect(el.querySelector('[aria-live="polite"].customization__error')?.textContent).toContain(
      'Size',
    );

    click(input('m'));

    expect(add()?.disabled).toBe(false);
  });

  it('never exceeds max_select and ignores unavailable options', () => {
    const { click, input } = render();

    click(input('a'));
    click(input('b'));

    expect(input('c')?.disabled).toBe(true);
    expect(input('a')?.checked).toBe(true);
  });

  it('updates the total with options and quantity', () => {
    const { el, click, add, input } = render();

    click(input('l'));
    click(input('a'));
    click('button[aria-label="Increase quantity"]');

    // (50 + 10 + 5) × 2
    expect(add()?.textContent).toContain('130.00');
    expect(el.querySelector('.customization__quantity span')?.textContent).toBe('2');
  });

  it('adds a consistent cart item, notifies and closes', () => {
    const { el, click, add, input } = render();

    click(input('l'));
    click(input('b'));
    const note = el.getElementsByTagName('textarea')[0];
    note.value = ' no ice ';
    note.dispatchEvent(new Event('input'));
    click(add());

    expect(addToCart).toHaveBeenCalledTimes(1);
    expect(addToCart.mock.calls[0][0]).toMatchObject({
      menu_item_id: 'tea',
      quantity: 1,
      note: 'no ice',
      unit_base_price: 50,
      total_price: 65,
      selected_options: [
        { group_id: 'size', option_id: 'l', label: 'l', price_delta: 10 },
        { group_id: 'top', option_id: 'b', label: 'b', price_delta: 5 },
      ],
    });
    expect((addToCart.mock.calls[0] as [{ id: string }])[0].id).toBeTruthy();
    expect(success).toHaveBeenCalledWith('Tea added to cart');
    expect(completeWith).toHaveBeenCalledWith('added');
  });

  it('adds directly when the product has no modifier groups', () => {
    response = of({ ...product, modifierGroups: [] });
    render();

    expect(addToCart).toHaveBeenCalledTimes(1);
    expect(addToCart.mock.calls[0][0]).toMatchObject({ selected_options: [], total_price: 50 });
    expect(completeWith).toHaveBeenCalledWith('added');
  });

  it('shows the groups immediately, without fetching, when the opener already loaded them', () => {
    data = product;
    response = new Subject<MenuItemWithModifiers>();
    const { el } = render();

    expect(el.textContent).not.toContain('Loading options');
    expect(el.querySelectorAll('fieldset').length).toBe(2);
  });

  it('adds nothing on its own when it is not validated', () => {
    render();

    expect(addToCart).not.toHaveBeenCalled();
  });
});
