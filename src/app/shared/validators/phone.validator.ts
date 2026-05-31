import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) {
      return null; // Don't validate empty values to allow optional fields
    }
    // Preserve the existing E.164 phone range
    // Also validate the length to be exactly 13 characters (including the country code)
    if (value.length !== 13 || !/^\+\d{1,3}\s?\d{10}$/.test(value)) {
      return { invalidPhone: true };
    }
    return null;
  };
}
