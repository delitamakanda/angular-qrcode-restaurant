import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneMask',
})
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
}
