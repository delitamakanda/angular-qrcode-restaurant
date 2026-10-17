import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { TuiDialogService, provideTaiga } from '@taiga-ui/core';
import { of } from 'rxjs';
import { CartStore } from '@app/state/cart.store';
import { AppHeader } from '../../shared/ui/layout/app-header/app-header';
import { BottomCartBar } from '../../shared/ui/layout/bottom-cart-bar/bottom-cart-bar';
import { ShopShell } from './shop-shell';

describe('ShopShell', () => {
  it('opens the cart sheet when the cart bar asks for it', () => {
    const open = vi.fn().mockReturnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        provideTaiga(),
        provideRouter([]),
        { provide: SwUpdate, useValue: { isEnabled: false } },
        { provide: TuiDialogService, useValue: { open } },
      ],
    });
    TestBed.overrideComponent(ShopShell, {
      remove: { imports: [AppHeader] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
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
    const fixture = TestBed.createComponent(ShopShell);
    fixture.detectChanges();

    const bar = fixture.debugElement.children
      .flatMap((c) => c.children)
      .find((d) => d.componentInstance instanceof BottomCartBar);
    (bar?.componentInstance as BottomCartBar).openCart.emit();

    expect(open).toHaveBeenCalledTimes(1);
  });
});
