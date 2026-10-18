import { FormControl } from '@angular/forms';
import { normalizePhone, phoneValidator } from './phone.validator';

describe('phoneValidator', () => {
  const validate = (value: string | null) => phoneValidator()(new FormControl(value));

  it.each([
    '+33606787045',
    '+1 2025550123',
    '+33 6 06 78 70 45',
    '+33.6.06.78.70.45',
    '+33-606787045',
  ])('accepts %s', (value) => {
    expect(validate(value)).toBeNull();
  });

  it.each(['0606787045', '+0123456789', '+12', '+1234567890123456', '+33abc'])(
    'rejects %s',
    (value) => {
      expect(validate(value)).toEqual({ invalidPhone: true });
    },
  );

  it('returns null for an empty value', () => {
    expect(validate('')).toBeNull();
    expect(validate(null)).toBeNull();
  });
});

describe('normalizePhone', () => {
  it('removes spaces, dots and dashes', () => {
    expect(normalizePhone('+33 6.06-78 70 45')).toBe('+33606787045');
  });
});
