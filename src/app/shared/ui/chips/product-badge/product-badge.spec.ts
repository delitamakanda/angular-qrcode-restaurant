import { TestBed } from '@angular/core/testing';
import { ProductBadgeType } from '@app/core/models/menu-item.model';
import { ProductBadge } from './product-badge';

describe('ProductBadge', () => {
  const cases: [ProductBadgeType, string][] = [
    ['popular', 'Popular'],
    ['new', 'New'],
    ['sold-out', 'Sold out'],
  ];

  it.each(cases)('renders the %s label', (type, label) => {
    const fixture = TestBed.createComponent(ProductBadge);
    fixture.componentRef.setInput('type', type);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent.trim()).toBe(label);
  });
});
