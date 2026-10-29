import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { OrderStatus } from '@app/core/models/order.model';
import { OrderStatusTimeline } from './order-status-timeline';

describe('OrderStatusTimeline', () => {
  let fixture: ComponentFixture<OrderStatusTimeline>;

  function render(status: OrderStatus | undefined): HTMLLIElement[] {
    TestBed.configureTestingModule({ providers: [provideTaiga()] });
    fixture = TestBed.createComponent(OrderStatusTimeline);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('li'));
  }

  const summary = (items: HTMLLIElement[]) => items.map((li) => li.textContent.trim());

  it('renders 5 steps for accepted, with aria-current on Accepted only', () => {
    const items = render('accepted');

    expect(items).toHaveLength(5);
    expect(summary(items)).toEqual([
      'PendingCompleted',
      'AcceptedCurrent',
      'PreparingUpcoming',
      'ReadyUpcoming',
      'CompletedUpcoming',
    ]);
    expect(items.map((li) => li.getAttribute('aria-current'))).toEqual([
      null,
      'step',
      null,
      null,
      null,
    ]);
  });

  it('treats undefined as pending', () => {
    const items = render(undefined);

    expect(items).toHaveLength(5);
    expect(summary(items)[0]).toBe('PendingCurrent');
    expect(items[0].getAttribute('aria-current')).toBe('step');
  });

  it('marks every step done for completed', () => {
    const items = render('completed');

    expect(summary(items).some((t) => t.endsWith('Upcoming'))).toBe(false);
    expect(items[4].getAttribute('aria-current')).toBe('step');
  });

  it('shows a single error step for cancelled', () => {
    const items = render('cancelled');

    expect(items).toHaveLength(1);
    expect(summary(items)).toEqual(['CancelledCancelled']);
    expect(items[0].classList).toContain('order-status-timeline__step_error');
  });

  it('updates when the status changes', () => {
    render('pending');
    fixture.componentRef.setInput('status', 'ready');
    fixture.detectChanges();

    const current = (fixture.nativeElement as HTMLElement).querySelector('[aria-current="step"]');
    expect(current?.textContent).toContain('Ready');
  });
});
