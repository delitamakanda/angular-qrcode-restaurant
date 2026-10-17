import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { CartStore } from '@app/state/cart.store';
import { BottomCartBar } from './bottom-cart-bar';

describe('BottomCartBar accessibility', () => {
  it('exposes an accessible name containing the count and the total', () => {
    TestBed.configureTestingModule({
      imports: [BottomCartBar],
      providers: [provideTaiga(), provideRouter([])],
    });
    TestBed.inject(CartStore).items.set([
      {
        id: '1',
        menu_item_id: 'm1',
        quantity: 2,
        name: 'Burger',
        note: '',
        unit_base_price: 5,
        selected_options: [],
        total_price: 10,
      },
    ]);
    const fixture = TestBed.createComponent(BottomCartBar);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    const label = button?.getAttribute('aria-label') ?? '';

    expect(label).toContain('2 item(s)');
    expect(label).toContain((button?.querySelector('strong')?.textContent ?? '').trim());
    expect(label).toContain('view cart');
  });

  it('emits openCart on click instead of navigating', () => {
    TestBed.configureTestingModule({
      imports: [BottomCartBar],
      providers: [provideTaiga(), provideRouter([])],
    });
    TestBed.inject(CartStore).items.set([
      {
        id: '1',
        menu_item_id: 'm1',
        quantity: 1,
        name: 'Burger',
        note: '',
        unit_base_price: 5,
        selected_options: [],
        total_price: 5,
      },
    ]);
    const fixture = TestBed.createComponent(BottomCartBar);
    const opened = vi.fn();
    fixture.componentInstance.openCart.subscribe(opened);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();

    expect(opened).toHaveBeenCalledTimes(1);
  });
});
