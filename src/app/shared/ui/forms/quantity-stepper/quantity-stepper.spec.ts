import { TestBed } from '@angular/core/testing';
import { MAX_QUANTITY } from '@app/core/constants/quantity.constants';
import { provideTaiga } from '@taiga-ui/core';
import { QuantityStepper } from './quantity-stepper';

function setup(value = 2) {
  TestBed.configureTestingModule({ providers: [provideTaiga()] });
  const fixture = TestBed.createComponent(QuantityStepper);
  fixture.componentRef.setInput('value', value);
  fixture.componentRef.setInput('label', 'Burger');
  const emitted: number[] = [];
  fixture.componentInstance.changed.subscribe((v) => emitted.push(v));
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, emitted };
}

describe('QuantityStepper', () => {
  it('renders the value', () => {
    const { el } = setup(3);

    expect(el.querySelector('.quantity-stepper__value')?.textContent.trim()).toBe('3');
  });

  it('emits value + 1 and value - 1 from buttons named after the product', () => {
    const { el, emitted } = setup(2);

    el.querySelector<HTMLButtonElement>('[aria-label="Increase quantity of Burger"]')?.click();
    el.querySelector<HTMLButtonElement>('[aria-label="Decrease quantity of Burger"]')?.click();

    expect(emitted).toEqual([3, 1]);
  });

  it('disables the increase button at the maximum', () => {
    const { el } = setup(MAX_QUANTITY);

    expect(
      el.querySelector<HTMLButtonElement>('[aria-label="Increase quantity of Burger"]')?.disabled,
    ).toBe(true);
  });

  it('keeps the decrease button enabled at 1 by default (removes the line)', () => {
    const { el } = setup(1);

    expect(
      el.querySelector<HTMLButtonElement>('[aria-label="Decrease quantity of Burger"]')?.disabled,
    ).toBe(false);
  });

  it('disables the decrease button at the minimum', () => {
    const { fixture, el } = setup(1);
    fixture.componentRef.setInput('min', 1);
    fixture.detectChanges();

    expect(
      el.querySelector<HTMLButtonElement>('[aria-label="Decrease quantity of Burger"]')?.disabled,
    ).toBe(true);
  });
});
