import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 404) {
        return throwError(() => 'Page not found' );
      } else if (error.status === 500) {
        return throwError(() => 'Internal server error' );
      } else {
        return throwError(() => 'An error occurred'  + error.message  );
      }
    })
  )
}
