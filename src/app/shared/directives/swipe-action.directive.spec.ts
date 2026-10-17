import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwipeActionDirective } from './swipe-action.directive';

@Component({
  imports: [SwipeActionDirective],
  template: `<div
    class="row"
    appSwipeAction
    [swipeThreshold]="threshold()"
    (swiped)="count.set(count() + 1)"
  ></div>`,
})
class HostComponent {
  readonly threshold = signal(96);
  readonly count = signal(0);
}

function fire(el: HTMLElement, type: string, x: number, y: number, pointerType = 'touch'): void {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { pointerId: 1, pointerType, clientX: x, clientY: y });
  el.dispatchEvent(event);
}

describe('SwipeActionDirective', () => {
  function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.row').item(0);
    return { fixture, el };
  }

  it('emits once when swiped left past the threshold', () => {
    const { fixture, el } = setup();
    fire(el, 'pointerdown', 200, 10);
    fire(el, 'pointermove', 50, 12);
    fire(el, 'pointerup', 50, 12);
    expect(fixture.componentInstance.count()).toBe(1);
  });

  it('does not emit and resets the transform below the threshold', () => {
    const { fixture, el } = setup();
    fire(el, 'pointerdown', 200, 10);
    fire(el, 'pointermove', 150, 10);
    fixture.detectChanges();
    expect(el.style.transform).toBe('translateX(-50px)');
    fire(el, 'pointerup', 150, 10);
    fixture.detectChanges();
    expect(fixture.componentInstance.count()).toBe(0);
    expect(el.style.transform).toBe('');
  });

  it('ignores vertical drags', () => {
    const { fixture, el } = setup();
    fire(el, 'pointerdown', 200, 10);
    fire(el, 'pointermove', 100, 200);
    fire(el, 'pointerup', 100, 200);
    expect(fixture.componentInstance.count()).toBe(0);
  });

  it('resets without emitting on pointercancel', () => {
    const { fixture, el } = setup();
    fire(el, 'pointerdown', 200, 10);
    fire(el, 'pointermove', 50, 10);
    fire(el, 'pointercancel', 50, 10);
    fire(el, 'pointerup', 50, 10);
    fixture.detectChanges();
    expect(fixture.componentInstance.count()).toBe(0);
    expect(el.style.transform).toBe('');
  });

  it('honours a custom threshold', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.threshold.set(200);
    fixture.detectChanges();
    fire(el, 'pointerdown', 300, 10);
    fire(el, 'pointermove', 150, 10);
    fire(el, 'pointerup', 150, 10);
    expect(fixture.componentInstance.count()).toBe(0);
    fire(el, 'pointerdown', 300, 10);
    fire(el, 'pointermove', 90, 10);
    fire(el, 'pointerup', 90, 10);
    expect(fixture.componentInstance.count()).toBe(1);
  });

  it('ignores mouse pointers', () => {
    const { fixture, el } = setup();
    fire(el, 'pointerdown', 200, 10, 'mouse');
    fire(el, 'pointermove', 0, 10, 'mouse');
    fire(el, 'pointerup', 0, 10, 'mouse');
    expect(fixture.componentInstance.count()).toBe(0);
  });
});
