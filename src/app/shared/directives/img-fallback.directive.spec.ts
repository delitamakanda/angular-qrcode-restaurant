import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ImgFallbackDirective } from './img-fallback.directive';

@Component({
  imports: [ImgFallbackDirective],
  template: `<img src="/missing.jpg" alt="" appImgFallback="/fallback.svg" />`,
})
class Host {}

describe('ImgFallbackDirective', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelectorAll('img')[0];
  }

  it('switches to the fallback on error', () => {
    const img = render();

    img.dispatchEvent(new Event('error'));

    expect(img.getAttribute('src')).toBe('/fallback.svg');
  });

  it('switches only once, even if the fallback fails too', () => {
    const img = render();

    img.dispatchEvent(new Event('error'));
    img.setAttribute('src', '/other.svg');
    img.dispatchEvent(new Event('error'));

    expect(img.getAttribute('src')).toBe('/other.svg');
  });
});
