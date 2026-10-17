import { Directive, computed, input, output, signal } from '@angular/core';

const MIN_THRESHOLD_PX = 96;
const THRESHOLD_RATIO = 0.3;
const AXIS_LOCK_PX = 8;

/**
 * Emits `swiped` when the host is dragged to the left past a threshold.
 * Touch and pen only; vertical drags are left to the browser (page scroll).
 * Always provide a non-gesture alternative (WCAG 2.5.1).
 */
@Directive({
  selector: '[appSwipeAction]',
  host: {
    '[style.touch-action]': '"pan-y"',
    '[style.transform]': 'transform()',
    '[style.transition]': 'transition()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'reset()',
  },
})
export class SwipeActionDirective {
  /** Minimum drag distance in px; the effective threshold is max(this, 30% of the host width). */
  readonly swipeThreshold = input(MIN_THRESHOLD_PX);
  readonly swiped = output<'left'>();

  private readonly offset = signal(0);
  private readonly dragging = signal(false);
  protected readonly transform = computed(() =>
    this.offset() === 0 ? '' : `translateX(${String(this.offset())}px)`,
  );
  protected readonly transition = computed(() => (this.dragging() ? 'none' : ''));

  private pointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private axis: 'x' | null = null;

  protected onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' || this.pointerId !== null) {
      return;
    }
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.axis = null;
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    if (this.axis === null) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_PX) {
        return;
      }
      if (Math.abs(dy) >= Math.abs(dx)) {
        this.pointerId = null;
        return;
      }
      this.axis = 'x';
      this.dragging.set(true);
      const target = event.currentTarget as HTMLElement;
      if ('setPointerCapture' in target) {
        target.setPointerCapture(event.pointerId);
      }
    }
    this.offset.set(Math.min(0, dx));
  }

  protected onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    const width = (event.currentTarget as HTMLElement).getBoundingClientRect().width;
    const threshold = Math.max(this.swipeThreshold(), width * THRESHOLD_RATIO);
    const passed = this.axis === 'x' && -this.offset() >= threshold;
    this.reset();
    if (passed) {
      this.swiped.emit('left');
    }
  }

  protected reset(): void {
    this.pointerId = null;
    this.axis = null;
    this.dragging.set(false);
    this.offset.set(0);
  }
}
