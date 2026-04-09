import { HttpInterceptorFn } from '@angular/common/http';

export const localeInterceptor: HttpInterceptorFn = (req, next) => {
  const clonedReq = req.clone({
    headers: req.headers.set('Accept-Language', 'en-US')
  })
  return next.handle(clonedReq);
}
