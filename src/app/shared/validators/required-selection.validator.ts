import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function requiredSelectionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as unknown;
    return value && (value as unknown[]).length > 0 ? null : { requiredSelection: true };
  };
}
