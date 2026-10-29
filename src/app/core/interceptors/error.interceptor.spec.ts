import { HttpContext, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@app/core/services/notification.service';
import { firstValueFrom, throwError } from 'rxjs';
import { SKIP_ERROR_NOTIFICATION, errorInterceptor } from './error.interceptor';

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

  function run(status: number, request = req): Promise<unknown> {
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status, statusText: 'x' }));
    return TestBed.runInInjectionContext(() =>
      firstValueFrom(errorInterceptor(request, next)).catch((e: unknown) => e),
    );
  }

  it('does not notify when the request opts out, but still propagates the error', async () => {
    const silent = req.clone({ context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) });

    expect(await run(404, silent)).toBe('Page not found');
    expect(error).not.toHaveBeenCalled();
  });

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
