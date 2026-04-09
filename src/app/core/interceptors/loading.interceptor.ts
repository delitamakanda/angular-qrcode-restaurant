import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { UiStore } from '../../state/ui.store';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const uiStore = inject(UiStore);

  uiStore.startLoading();

  return next.handle(req).pipe(
    finalize(() => {
      uiStore.stopLoading();
    })
  );
}
