import { TestBed } from '@angular/core/testing';
import { MenuItemCard } from './menu-item-card';

describe('MenuItemCard accessibility', () => {
  it('includes the product name in the add button accessible name', () => {
    const fixture = TestBed.createComponent(MenuItemCard);
    fixture.componentRef.setInput('item', {
      id: 'm1',
      name: 'Burger',
      category_id: 'c1',
      base_price: 5,
      is_sold_out: false,
    });
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');

    expect(button?.getAttribute('aria-label')).toBe('Add to cart: Burger');
  });
});
