import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { OrderApiService } from '@app/core/api/order-api.service';
import { APP_TOKEN_CONFIG } from '@app/core/config/app.token';
import { Order } from '@app/core/models/order.model';
import { TrackingApiService } from './tracking-api.service';

const order = (status: Order['status']) => ({ id: 'o1', status }) as Order;

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }
}

describe('TrackingApiService', () => {
  const getOrder = vi.fn();

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        { provide: OrderApiService, useValue: { getOrder } },
        { provide: APP_TOKEN_CONFIG, useValue: { BASE_API_URL: 'http://api' } },
      ],
    });
    return TestBed.inject(TrackingApiService);
  }

  function setVisibility(state: 'visible' | 'hidden') {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
    document.dispatchEvent(new Event('visibilitychange'));
  }

  beforeEach(() => {
    getOrder.mockReset();
    FakeEventSource.instances = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('polling (no EventSource)', () => {
    beforeEach(() => vi.stubGlobal('EventSource', undefined));

    it('emits the initial order, then each poll, and completes on a terminal status', () => {
      getOrder
        .mockReturnValueOnce(of(order('pending')))
        .mockReturnValueOnce(of(order('preparing')))
        .mockReturnValueOnce(of(order('completed')));
      const next = vi.fn<(order: Order) => void>();
      const complete = vi.fn();

      setup().watchOrder('o1').subscribe({ next, complete });
      expect(next).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(5000);
      vi.advanceTimersByTime(5000);

      expect(next.mock.calls.map(([o]) => o.status)).toEqual(['pending', 'preparing', 'completed']);
      expect(complete).toHaveBeenCalled();
      expect(getOrder).toHaveBeenCalledWith('o1', { silent: true });
      vi.advanceTimersByTime(60_000);
      expect(getOrder).toHaveBeenCalledTimes(3);
    });

    it('completes on cancelled', () => {
      getOrder.mockReturnValue(of(order('cancelled')));
      const complete = vi.fn();

      setup().watchOrder('o1').subscribe({ complete });

      expect(complete).toHaveBeenCalled();
    });

    it('waits one interval before the first poll when immediate is false', () => {
      getOrder.mockReturnValue(of(order('accepted')));

      const sub = setup().watchOrder('o1', { immediate: false }).subscribe();
      expect(getOrder).not.toHaveBeenCalled();
      vi.advanceTimersByTime(5000);

      expect(getOrder).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
    });

    it('retries with a capped backoff and never errors', () => {
      getOrder.mockReturnValue(throwError(() => new Error('offline')));
      const error = vi.fn();

      const sub = setup().watchOrder('o1').subscribe({ error });
      expect(getOrder).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(10_000);
      expect(getOrder).toHaveBeenCalledTimes(2);
      vi.advanceTimersByTime(20_000);
      expect(getOrder).toHaveBeenCalledTimes(3);
      vi.advanceTimersByTime(30_000);
      expect(getOrder).toHaveBeenCalledTimes(4);
      vi.advanceTimersByTime(30_000);
      expect(getOrder).toHaveBeenCalledTimes(5);

      expect(error).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('stops the timer and the pending request on unsubscribe', () => {
      const pending = new Subject<Order>();
      getOrder.mockReturnValue(pending);

      setup().watchOrder('o1').subscribe().unsubscribe();
      vi.advanceTimersByTime(60_000);

      expect(getOrder).toHaveBeenCalledTimes(1);
      expect(pending.observed).toBe(false);
    });

    it('pauses while the tab is hidden and refetches when it becomes visible', () => {
      getOrder.mockReturnValue(of(order('accepted')));
      const sub = setup().watchOrder('o1').subscribe();
      expect(getOrder).toHaveBeenCalledTimes(1);

      setVisibility('hidden');
      vi.advanceTimersByTime(30_000);
      expect(getOrder).toHaveBeenCalledTimes(1);

      setVisibility('visible');
      expect(getOrder).toHaveBeenCalledTimes(2);
      vi.advanceTimersByTime(5000);
      expect(getOrder).toHaveBeenCalledTimes(3);
      sub.unsubscribe();
    });
  });

  describe('with EventSource', () => {
    beforeEach(() => vi.stubGlobal('EventSource', FakeEventSource));

    it('emits stream messages and closes the source on completion', () => {
      const next = vi.fn();
      const complete = vi.fn();

      setup().watchOrder('o1').subscribe({ next, complete });
      const source = FakeEventSource.instances[0];
      source.onmessage?.({ data: JSON.stringify(order('pending')) } as MessageEvent<string>);
      source.onmessage?.({ data: JSON.stringify(order('completed')) } as MessageEvent<string>);

      expect(source.url).toBe('http://api/orders/o1/events');
      expect(next).toHaveBeenCalledTimes(2);
      expect(complete).toHaveBeenCalled();
      expect(source.close).toHaveBeenCalled();
      expect(getOrder).not.toHaveBeenCalled();
    });

    it('closes the source on unsubscribe', () => {
      setup().watchOrder('o1').subscribe().unsubscribe();

      expect(FakeEventSource.instances[0].close).toHaveBeenCalled();
    });

    it('falls back to polling when the stream fails', () => {
      getOrder.mockReturnValue(of(order('ready')));
      const next = vi.fn();

      const sub = setup().watchOrder('o1').subscribe({ next });
      FakeEventSource.instances[0].onerror?.();

      expect(FakeEventSource.instances[0].close).toHaveBeenCalled();
      expect(getOrder).toHaveBeenCalledWith('o1', { silent: true });
      expect(next).toHaveBeenCalledWith(order('ready'));
      sub.unsubscribe();
    });
  });
});
