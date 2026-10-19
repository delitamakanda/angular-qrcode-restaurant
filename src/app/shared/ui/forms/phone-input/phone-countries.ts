export type CountryCode = 'FR' | 'BE' | 'CH' | 'GB' | 'DE' | 'ES' | 'IT' | 'US' | 'CA' | 'TW';

export interface PhoneCountry {
  code: CountryCode;
  name: string;
  flag: string;
  /** International dialling code, without the leading `+`. */
  dialCode: string;
  /** National number mask: `#` is a digit, any other character is a literal. */
  mask: string;
  /** Whether a leading national trunk `0` is dropped in the international format. */
  trunkZero: boolean;
}

export const DEFAULT_COUNTRY: CountryCode = 'FR';

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    dialCode: '33',
    mask: '# ## ## ## ##',
    trunkZero: true,
  },
  {
    code: 'BE',
    name: 'Belgium',
    flag: '🇧🇪',
    dialCode: '32',
    mask: '### ## ## ##',
    trunkZero: true,
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    dialCode: '41',
    mask: '## ### ## ##',
    trunkZero: true,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '44',
    mask: '#### ######',
    trunkZero: true,
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    dialCode: '49',
    mask: '### #######',
    trunkZero: true,
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    dialCode: '34',
    mask: '### ## ## ##',
    trunkZero: false,
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    dialCode: '39',
    mask: '### ### ####',
    trunkZero: false,
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '1',
    mask: '(###) ###-####',
    trunkZero: false,
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dialCode: '1',
    mask: '(###) ###-####',
    trunkZero: false,
  },
  {
    code: 'TW',
    name: 'Taiwan',
    flag: '🇹🇼',
    dialCode: '886',
    mask: '## #### ####',
    trunkZero: false,
  },
];

export function findCountry(code: CountryCode): PhoneCountry {
  return PHONE_COUNTRIES.find((country) => country.code === code) ?? PHONE_COUNTRIES[0];
}
