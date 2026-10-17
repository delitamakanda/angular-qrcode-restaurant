import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { NotificationService } from '@app/core/services/notification.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`HTTP ${String(error.status)} on ${req.method} ${req.url}`, error);
      notifications.error(
        error.status === 404 ? 'Page not found.' : 'An error occurred, please try again.',
      );

      if (error.status === 404) {
        return throwError(() => 'Page not found');
      } else if (error.status === 500) {
        return throwError(() => 'Internal server error');
      } else {
        return throwError(() => 'An error occurred' + error.message);
      }
    }),
  );
};
