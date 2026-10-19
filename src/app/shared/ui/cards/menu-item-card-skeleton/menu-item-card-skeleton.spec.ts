import { TestBed } from '@angular/core/testing';
import { MenuItemCardSkeleton } from './menu-item-card-skeleton';

describe('MenuItemCardSkeleton', () => {
  function render() {
    const fixture = TestBed.createComponent(MenuItemCardSkeleton);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('is hidden from assistive technologies', () => {
    expect(render().getAttribute('aria-hidden')).toBe('true');
  });

  it('reserves an image block', () => {
    expect(render().querySelector('.menu-item-card-skeleton__image')).not.toBeNull();
  });

  it('contains no focusable element', () => {
    const focusable = render().querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]',
    );

    expect(focusable.length).toBe(0);
  });
});
