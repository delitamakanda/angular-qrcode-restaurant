import { TestBed } from '@angular/core/testing';
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
    const { el } = setup(99);

    expect(
      el.querySelector<HTMLButtonElement>('[aria-label="Increase quantity of Burger"]')?.disabled,
    ).toBe(true);
  });
});
