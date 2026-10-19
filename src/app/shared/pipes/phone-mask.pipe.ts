import { Pipe, PipeTransform } from '@angular/core';
import { CountryCode, DEFAULT_COUNTRY, findCountry } from '../ui/forms/phone-input/phone-countries';

/** Formats the national part of a phone number with the mask of the given country. */
@Pipe({
  name: 'phoneMask',
})
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string | null | undefined, country: CountryCode = DEFAULT_COUNTRY): string {
    const digits = (value ?? '').replace(/\D/g, '');
    if (!digits) {
      return '';
    }
    let result = '';
    let index = 0;
    for (const char of findCountry(country).mask) {
      if (index >= digits.length) {
        break;
      }
      if (char === '#') {
        result += digits[index++];
      } else {
        result += char;
      }
    }
    return result + digits.slice(index);
  }
}
