import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

/** Removes the spaces, dots and dashes users commonly type in a phone number. */
export function normalizePhone(value: string): string {
  return value.replace(/[\s.-]/g, '');
}

/** Validates an international E.164 phone number. Empty values are left to `Validators.required`. */
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    return E164_PATTERN.test(normalizePhone(value)) ? null : { invalidPhone: true };
  };
}
