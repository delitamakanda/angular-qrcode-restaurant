import { Directive, input } from '@angular/core';

@Directive({
  selector: 'img[appImgFallback]',
  host: { '(error)': 'onError($event)' },
})
export class ImgFallbackDirective {
  readonly appImgFallback = input.required<string>();
  private fallbackApplied = false;

  protected onError(event: Event): void {
    if (this.fallbackApplied) {
      return;
    }
    this.fallbackApplied = true;
    (event.target as HTMLImageElement).src = this.appImgFallback();
  }
}
