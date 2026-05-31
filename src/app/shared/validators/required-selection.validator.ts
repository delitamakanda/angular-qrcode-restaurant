import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function requiredSelectionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as unknown;
    return value ? null : { requiredSelection: true };
  };
}
