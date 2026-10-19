import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TuiInput, TuiLabel, TuiTextfield } from '@taiga-ui/core';
import { PhoneMaskPipe } from '../../../pipes/phone-mask.pipe';
import { CountryCode, DEFAULT_COUNTRY, PHONE_COUNTRIES, findCountry } from './phone-countries';

const MAX_E164_DIGITS = 15;

@Component({
  selector: 'app-phone-input',
  imports: [TuiTextfield, TuiLabel, TuiInput, PhoneMaskPipe],
  templateUrl: './phone-input.html',
  styleUrl: './phone-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInput),
      multi: true,
    },
  ],
})
export class PhoneInput implements ControlValueAccessor {
  readonly inputId = input('phone');
  readonly label = input('Phone number');
  readonly required = input(false);
  readonly ariaInvalid = input<'true' | 'false' | null>(null);
  readonly ariaDescribedby = input<string | null>(null);

  protected readonly countries = PHONE_COUNTRIES;
  protected readonly country = signal<CountryCode>(DEFAULT_COUNTRY);
  protected readonly national = signal('');
  protected readonly disabled = signal(false);

  private readonly mask = new PhoneMaskPipe();
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.setFromText((value ?? '').replace(/[\s.-]/g, ''));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    this.setFromText(element.value.trim());
    // The binding does not re-render when the digits are unchanged (e.g. a letter was typed).
    element.value = this.mask.transform(this.national(), this.country());
    this.emit();
  }

  protected onCountryChange(event: Event): void {
    this.country.set((event.target as HTMLSelectElement).value as CountryCode);
    this.national.set(this.toNational(this.national(), this.country()));
    this.emit();
  }

  private emit(): void {
    const digits = this.national();
    this.onChange(digits ? `+${findCountry(this.country()).dialCode}${digits}` : '');
  }

  private setFromText(text: string): void {
    if (text.startsWith('+')) {
      this.applyInternational(text);
    } else {
      this.national.set(this.toNational(text.replace(/\D/g, ''), this.country()));
    }
  }

  /** Picks the country matching the dial code of an international number, preferring the current one. */
  private applyInternational(text: string): void {
    const digits = text.replace(/\D/g, '');
    const current = findCountry(this.country());
    const match =
      [current, ...PHONE_COUNTRIES]
        .filter((country) => digits.startsWith(country.dialCode))
        .sort((a, b) => b.dialCode.length - a.dialCode.length)[0] ?? current;
    this.country.set(match.code);
    this.national.set(this.toNational(digits.slice(match.dialCode.length), match.code));
  }

  private toNational(digits: string, code: CountryCode): string {
    const { trunkZero, dialCode } = findCountry(code);
    const stripped = trunkZero ? digits.replace(/^0+/, '') : digits;
    return stripped.slice(0, MAX_E164_DIGITS - dialCode.length);
  }
}
