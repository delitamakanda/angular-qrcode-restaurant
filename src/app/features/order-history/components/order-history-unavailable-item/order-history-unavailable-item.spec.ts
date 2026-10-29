import { TestBed } from '@angular/core/testing';
import { OrderHistoryUnavailableItem } from './order-history-unavailable-item';

const ID = 'order-83396ede-c634-41da-98c6-3e9a5fa6d338';

describe('OrderHistoryUnavailableItem', () => {
  function render() {
    const fixture = TestBed.createComponent(OrderHistoryUnavailableItem);
    fixture.componentRef.setInput('entry', {
      id: ID,
      store_id: 'demo',
      created_at: '2026-01-01T10:00:00Z',
    });
    fixture.detectChanges();
    return fixture;
  }

  it('shows the explicit label, short id and local date', () => {
    const text = (render().nativeElement as HTMLElement).textContent;

    expect(text).toContain('Details unavailable');
    expect(text).toContain('3e9a5fa6d338'.slice(-8));
    expect(text).toContain('2026');
  });

  it('emits the id when removed', () => {
    const fixture = render();
    const removed = vi.fn();
    fixture.componentInstance.removed.subscribe(removed);

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();

    expect(removed).toHaveBeenCalledWith(ID);
  });
});
