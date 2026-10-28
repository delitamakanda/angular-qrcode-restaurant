import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CartSummary } from './cart-summary';

@Component({
  imports: [CartSummary],
  template: `<app-cart-summary [count]="count" [total]="total"
    ><button>Go</button></app-cart-summary
  >`,
})
class Host {
  count = 2;
  total = 9.5;
}

function render(count = 2) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.count = count;
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('CartSummary', () => {
  it('shows the formatted total and a plural item count', () => {
    const el = render();

    expect(el.textContent).toContain('2 items');
    expect(el.textContent).toContain('$9.50');
  });

  it('uses the singular label for one item', () => {
    expect(render(1).textContent).toContain('1 item');
    expect(render(1).textContent).not.toContain('1 items');
  });

  it('projects its content and exposes a labelled region', () => {
    const el = render();

    expect(el.querySelector('app-cart-summary button')?.textContent).toBe('Go');
    expect(el.querySelector('app-cart-summary')?.getAttribute('aria-label')).toBe(
      'Résumé de la commande',
    );
  });
});
