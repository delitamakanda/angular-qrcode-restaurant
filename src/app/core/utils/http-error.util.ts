import { HttpErrorResponse } from '@angular/common/http';

/** `errorInterceptor` rewrites a 404 into this string before it reaches callers. */
const NOT_FOUND_MESSAGE = 'Page not found';

export function isNotFound(error: unknown): boolean {
  return (
    error === NOT_FOUND_MESSAGE || (error instanceof HttpErrorResponse && error.status === 404)
  );
}
