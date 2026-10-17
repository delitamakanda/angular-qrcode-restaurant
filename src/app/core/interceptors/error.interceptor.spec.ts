import { HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@app/core/services/notification.service';
import { firstValueFrom, throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  const error = vi.fn();
  const req = new HttpRequest('GET', '/api/test');

  beforeEach(() => {
    error.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: NotificationService, useValue: { error } }],
    });
  });

  function run(status: number): Promise<unknown> {
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status, statusText: 'x' }));
    return TestBed.runInInjectionContext(() =>
      firstValueFrom(errorInterceptor(req, next)).catch((e: unknown) => e),
    );
  }

  it.each([
    [404, 'Page not found'],
    [500, 'Internal server error'],
  ])('notifies and propagates the error for %i', async (status, message) => {
    expect(await run(status)).toBe(message);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('notifies and propagates other errors', async () => {
    expect(await run(503)).toEqual(expect.stringContaining('An error occurred'));
    expect(error).toHaveBeenCalledTimes(1);
  });
});
