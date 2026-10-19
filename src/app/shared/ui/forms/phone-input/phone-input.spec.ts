import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideTaiga } from '@taiga-ui/core';
import { phoneValidator } from '../../../validators/phone.validator';
import { PhoneInput } from './phone-input';

@Component({
  imports: [ReactiveFormsModule, PhoneInput],
  template: `<app-phone-input
    [formControl]="control"
    inputId="tel"
    ariaInvalid="true"
    ariaDescribedby="tel-error"
  />`,
})
class Host {
  readonly control = new FormControl('', { nonNullable: true, validators: [phoneValidator()] });
}

function queryInput(root: HTMLElement): HTMLInputElement {
  const found = root.querySelector('input');
  if (!found) {
    throw new Error('Missing input');
  }
  return found;
}

function querySelect(root: HTMLElement): HTMLSelectElement {
  const found = root.querySelector('select');
  if (!found) {
    throw new Error('Missing select');
  }
  return found;
}

describe('PhoneInput', () => {
  function render() {
    TestBed.configureTestingModule({ providers: [provideTaiga()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      control: fixture.componentInstance.control,
      input: queryInput(el),
      select: querySelect(el),
    };
  }

  function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('writes an E.164 value as France and a masked number', async () => {
    const { fixture, control, input, select } = render();
    control.setValue('+33606787045');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input.value).toBe('6 06 78 70 45');
    expect(select.value).toBe('FR');
  });

  it('emits an E.164 value while typing and strips non digits and the trunk zero', () => {
    const { control, input } = render();
    type(input, '06 06 78 70 45');

    expect(control.value).toBe('+33606787045');
    expect(control.valid).toBe(true);
    expect(input.value).toBe('6 06 78 70 45');

    type(input, '');
    expect(control.value).toBe('');
  });

  it('recomputes the value when the country changes', () => {
    const { fixture, control, input, select } = render();
    type(input, '6067870450');
    select.value = 'US';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(control.value).toBe('+16067870450');
    expect(input.value).toBe('(606) 787-0450');
  });

  it('detects the country of a pasted international number', () => {
    const { fixture, control, input, select } = render();
    type(input, '+44 7911 123456');
    fixture.detectChanges();

    expect(select.value).toBe('GB');
    expect(control.value).toBe('+447911123456');
  });

  it('disables both fields and marks touched on blur', () => {
    const { fixture, control, input, select } = render();
    input.dispatchEvent(new Event('blur'));
    expect(control.touched).toBe(true);

    control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(select.disabled).toBe(true);
  });

  it('exposes the accessibility attributes', () => {
    const { input, select } = render();

    expect(input.id).toBe('tel');
    expect(input.type).toBe('tel');
    expect(input.getAttribute('inputmode')).toBe('tel');
    expect(input.getAttribute('autocomplete')).toBe('tel-national');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('tel-error');
    expect(select.getAttribute('aria-label')).toBe('Pays / indicatif');
  });
});
