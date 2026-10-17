import { TestBed } from '@angular/core/testing';
import { TuiNotificationService } from '@taiga-ui/core';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  const subscribe = vi.fn();
  const open = vi.fn(() => ({ subscribe }));

  beforeEach(() => {
    open.mockClear();
    subscribe.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: TuiNotificationService, useValue: { open } }],
    });
    service = TestBed.inject(NotificationService);
  });

  it('opens a positive notification on success', () => {
    service.success('Done');

    expect(open).toHaveBeenCalledWith('Done', {
      appearance: 'positive',
      autoClose: 4000,
      closable: true,
    });
    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it('opens a negative, longer-lived notification on error', () => {
    service.error('Oops');

    expect(open).toHaveBeenCalledWith('Oops', {
      appearance: 'negative',
      autoClose: 8000,
      closable: true,
    });
  });

  it('opens info and warning notifications', () => {
    service.info('FYI');
    service.warning('Careful');

    expect(open).toHaveBeenCalledWith('FYI', expect.objectContaining({ appearance: 'info' }));
    expect(open).toHaveBeenCalledWith(
      'Careful',
      expect.objectContaining({ appearance: 'warning' }),
    );
  });
});
