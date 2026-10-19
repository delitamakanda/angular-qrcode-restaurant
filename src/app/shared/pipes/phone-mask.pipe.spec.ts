import { PhoneMaskPipe } from './phone-mask.pipe';

describe('PhoneMaskPipe', () => {
  const pipe = new PhoneMaskPipe();

  it('formats French numbers by default', () => {
    expect(pipe.transform('606787045')).toBe('6 06 78 70 45');
  });

  it('formats US numbers', () => {
    expect(pipe.transform('6067870450', 'US')).toBe('(606) 787-0450');
  });

  it('formats partial input', () => {
    expect(pipe.transform('6067', 'FR')).toBe('6 06 7');
    expect(pipe.transform('60', 'US')).toBe('(60');
  });

  it('returns an empty string for null, undefined and empty values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('ignores non numeric characters and keeps extra digits', () => {
    expect(pipe.transform('6-06 abc 78.70.45', 'FR')).toBe('6 06 78 70 45');
    expect(pipe.transform('60678704512', 'FR')).toBe('6 06 78 70 4512');
  });
});
