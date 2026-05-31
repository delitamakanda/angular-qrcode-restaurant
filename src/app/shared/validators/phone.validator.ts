import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) {
      return null; // Don't validate empty values to allow optional fields
    }
    const phoneRegex = /^\+\d{1,3}\s?\d{10}$/;
    const valid = phoneRegex.test(value);
    return valid ? null : { invalidPhone: true };
  };
}
